import { TreeCursor } from "web-tree-sitter";
import { TreeSitterNode } from "../parse";
import type * as Grammar from "../grammar/tree-sitter-types-formatter";

// Extend comment node with extra property
declare module "../grammar/tree-sitter-types-formatter" {
    interface comment_Node {
        leading: boolean;
        trailing: boolean;
        trailingSpaces: number;
    }
}

export class WhitespaceSensitiveCursor<TNode extends Extract<Grammar.AllNodes, { walk(): Grammar.TypedCursor<any> }>>
    implements Grammar.TypedCursor<Grammar.WalkerNodes<TNode>>
{
    private cursor: TreeCursor;

    constructor(node: TNode) {
        this.cursor = node.walk() as any;
    }

    private syntheticNode: Grammar.WalkerNodes<TNode> | undefined;
    private _currentNode: TreeSitterNode = undefined!;

    public get currentNode() {
        return this.syntheticNode ?? (this._currentNode as Grammar.WalkerNodes<TNode>);
    }
    public get nodeType() {
        return this.currentNode.type;
    }
    public get nodeText() {
        return this.currentNode.text;
    }

    public toString() {
        return `[Cursor at node of type <${this.currentNode.type}> "${this.currentNode.text}"]`;
    }

    public pos() {
        return this;
    }

    gotoFirstChild(): boolean {
        if (this.cursor.gotoFirstChild()) {
            this.syntheticNode = undefined;
            this._currentNode = this.cursor.currentNode;
            return true;
        } else {
            return false;
        }
    }
    gotoNextSibling(): boolean {
        if (this.syntheticNode) {
            this.syntheticNode = undefined;
            return true;
        } else {
            const previousNode = this._currentNode;
            if (this.cursor.gotoNextSibling()) {
                const newNode = this.cursor.currentNode;
                this._currentNode = newNode;
                if (newNode.startPosition.row > previousNode.endPosition.row + 1) {
                    // Insert synthetic whiteline node
                    this.syntheticNode = {
                        type: "whiteline",
                        isError: false,
                        isNamed: true,
                        text: "",
                    } as any;
                }
                if (newNode.type === "comment") {
                    if (previousNode.endPosition.row === newNode.startPosition.row) {
                        const commentNode = this._currentNode as Grammar.BaseNode as Grammar.comment_Node;
                        commentNode.trailing = true;
                        commentNode.trailingSpaces = newNode.startPosition.column - previousNode.endPosition.column;
                    }
                    if (this.cursor.gotoNextSibling()) {
                        if (this.cursor.currentNode.startPosition.row === newNode.endPosition.row) {
                            (this._currentNode as unknown as Grammar.comment_Node).leading = true;
                        }
                        this.cursor.gotoPreviousSibling();
                    }
                }
                return true;
            } else {
                return false;
            }
        }
    }
    gotoParent(): boolean {
        if (this.cursor.gotoParent()) {
            this.syntheticNode = undefined;
            this._currentNode = this.cursor.currentNode;
            return true;
        } else {
            return false;
        }
    }
}
