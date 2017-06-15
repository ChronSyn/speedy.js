import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";

import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";

class FirstLiteralTokenCodeGenerator implements SyntaxCodeGenerator<ts.LiteralExpression, Primitive> {
    syntaxKind = ts.SyntaxKind.FirstLiteralToken;

    generate(node: ts.LiteralExpression, context: CodeGenerationContext): Primitive {
        const type = context.typeChecker.getTypeAtLocation(node);
        let value: llvm.Value;

        if (type.flags & ts.TypeFlags.IntLike) {
            value = llvm.ConstantInt.get(context.llvmContext, +node.text);
        } else if (type.flags & ts.TypeFlags.NumberLike) {
            value = llvm.ConstantFP.get(context.llvmContext, +node.text);
        } else {
            throw CodeGenerationDiagnostics.unsupportedLiteralType(node, context.typeChecker.typeToString(type));
        }

        return new Primitive(value, type);
    }
}

export default FirstLiteralTokenCodeGenerator;
