import * as Parser from "web-tree-sitter";

export function walkAllNodes(node: Parser.SyntaxNode, callback: (node: Parser.SyntaxNode) => void) {
    const cursor = node.walk();

    let recurse = true;
    let finished = false;
    do {
        // enter child
        if (recurse && cursor.gotoFirstChild()) {
            recurse = true;
            //enter(node);
            callback(cursor.currentNode);
        } else {
            //exit(node)

            // go to sibling
            if (cursor.gotoNextSibling()) {
                recurse = true;
                callback(cursor.currentNode);
                //enter(node);
            } else if (cursor.gotoParent()) {
                recurse = false;
            } else {
                finished = true;
            }
        }
    } while (!finished);
}
