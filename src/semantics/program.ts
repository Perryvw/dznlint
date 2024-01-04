import { ASTNode } from "../linting-rule";

// class Program {

// }

// enum Kind {

// }

// class Component {

// }

// class Interface {

// }

// class SourceFile {
//     public imports: SourceFile[] = [];
// }

export class SemanticSymbol {}

export enum TypeKind {
    Invalid,
    External,
    EnumMember,
    Interface,
    Component,
    Function,
}

export interface Type {
    kind: TypeKind;
    name: string;
}

// interface FunctionParameter {
//     direction: "in" | "out" | "inout";
//     name: string;
//     type: Type;
// }

// interface FunctionType extends Type
// {
//     kind: TypeKind.Function;
//     parameters: FunctionParameter;
//     returnType: Type;
// }

export class TypeChecker {
    public typeOfNode(node: ASTNode): Type {
        void node;
        //const symbol = this.symbolOfNode(node);

        return { kind: TypeKind.Invalid, name: "unknown" };
    }

    public symbolOfNode(node: ASTNode): SemanticSymbol {
        void node;
        return new SemanticSymbol();
    }

    // public getDeclaration(type: Type): AstNode {

    // }

    // public isFunctionType(type: Type): type is FunctionType
    // {
    //     return "returnType" in type;
    // }

    // public getMembers(type: Type): string[]
    // {

    // }
}
