import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {TypeChecker} from "../../type-checker";

/**
 * Resolved function parameter
 */
export interface ResolvedFunctionParameter {
    /**
     * The name of the function argument / parameter
     */
    name: string;

    /**
     * The symbol of the function
     * Absent if this is an anonymous function
     */
    symbol?: ts.Symbol;

    /**
     * The type of the argument / parameter (for this the resolved function)
     */
    type: ts.Type;

    /**
     * Initializer to use in case the optional argument value is absent
     */
    initializer?: ts.Expression;

    /**
     * Indicator if this argument is optional (and therefore, might need to be initialized with the initializer)
     */
    optional: boolean;

    /**
     * Indicator if this parameter is a vararg parameter
     */
    variadic: boolean;
}

/**
 * A resolved function to a specific specialization of a possible generic / overloaded function
 */
export interface ResolvedFunction {

    /**
     * The type of the object to which this function belongs (if any)
     */
    classType?: ts.ObjectType;

    /**
     * Indicator if the function is an instance function
     */
    instanceMethod: boolean;

    /**
     * Indicator if the function is async
     */
    async: boolean;

    /**
     * The unmangled name of the function. Absent, if this is an anonymous function
     */
    functionName?: string;

    /**
     * The parameters of the resolved function. Differs from the declaration as the types are specific for the resolved function
     * (e.g. push(3), the type of the first element is number and not T).
     */
    parameters: ResolvedFunctionParameter[];

    /**
     * The type parameters passed
     */
    typeParameters: ts.Type[];

    /**
     * The resolved return type of the function
     */
    returnType: ts.Type;

    /**
     * The source file in which the function is declared
     */
    sourceFile?: ts.SourceFile;

    symbol?: ts.Symbol;

    /**
     * The declaration
     */
    declaration?: ts.SignatureDeclaration;

    /**
     * The definition of the function (if any)
     */
    definition?: ts.FunctionLikeDeclaration & { body: ts.Block | ts.Expression };
}

/**
 * Creates a new resolved function
 */
export function createResolvedFunction(name: string,
                                       typeParameters: ts.Type[],
                                       parameters: ResolvedFunctionParameter[],
                                       returnType: ts.Type,
                                       sourceFile?: ts.SourceFile,
                                       classType?: ts.ObjectType,
                                       instanceMethod = false,
                                       async = false): ResolvedFunction {
    return {
        async,
        functionName: name,
        parameters,
        typeParameters,
        instanceMethod,
        returnType,
        sourceFile,
        classType
    };
}

/**
 * Creates a new resolved parameter
 */
export function createResolvedParameter(name: string,
                                        type: ts.Type,
                                        optional = false,
                                        initializer?: ts.Expression,
                                        variadic = false): ResolvedFunctionParameter {
    return {
        name,
        type,
        optional,
        initializer,
        variadic
    };
}

/**
 * Creates a new resolved function from a signature
 * @param signature the signature
 * @param compilationContext the compilation context
 * @param classType the class type if the function belongs to a class
 * @returns the created resolved function
 */
export function createResolvedFunctionFromSignature(signature: ts.Signature,
                                                    compilationContext: CompilationContext,
                                                    classType?: ts.ObjectType): ResolvedFunction {
    const returnType = signature.getReturnType();

    let definition = (signature.declaration as ts.FunctionLikeDeclaration).body ? signature.declaration as ts.FunctionLikeDeclaration : undefined;
    const symbol =  signature.declaration.name ? compilationContext.typeChecker.getSymbolAtLocation(signature.declaration.name) : undefined;

    if (symbol && symbol.declarations && symbol.declarations.length > 1) {
        const isOverloadPredicate = (decl: ts.FunctionLikeDeclaration) => compilationContext.typeChecker.isImplementationOfOverload(decl);
        definition = (symbol.declarations as ts.FunctionLikeDeclaration[]).find(isOverloadPredicate) || definition;
    }

    return {
        async: !!signature.declaration.modifiers && !!signature.declaration.modifiers.find(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword),
        classType: classType || getClassType(signature, compilationContext.typeChecker),
        declaration: signature.declaration,
        definition: definition as ts.FunctionLikeDeclaration & { body: ts.Block | ts.Expression },
        functionName: getDeclaredFunctionName(signature.declaration, compilationContext.typeChecker),
        instanceMethod: isInstanceMethod(signature.declaration),
        parameters: getResolvedParameters(signature, compilationContext.typeChecker),
        returnType,
        sourceFile: signature.declaration.getSourceFile(),
        symbol,
        typeParameters: signature.typeParameters || []
    };
}

function getClassType(signature: ts.Signature, typeChecker: TypeChecker): ts.ObjectType | undefined {
    const declaration = signature.getDeclaration();
    if (declaration.kind === ts.SyntaxKind.ConstructSignature) {
        return signature.getReturnType() as ts.ObjectType;
    }

    if (declaration.kind === ts.SyntaxKind.MethodSignature) {
        return typeChecker.getTypeAtLocation(declaration.parent!) as ts.ObjectType;
    }

    return undefined;
}

function isInstanceMethod(declaration: ts.SignatureDeclaration) {
    if (declaration.kind === ts.SyntaxKind.ConstructSignature) {
        return false;
    }

    if (declaration.kind === ts.SyntaxKind.MethodSignature || declaration.kind === ts.SyntaxKind.MethodDeclaration) {
        const modifiers = declaration.modifiers || [] as ts.Modifier[];
        return !modifiers.find(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword);
    }

    return false;
}

function getDeclaredFunctionName(declaration: ts.SignatureDeclaration, typeChecker: TypeChecker) {
    if (declaration.kind === ts.SyntaxKind.ConstructSignature || declaration.kind === ts.SyntaxKind.Constructor) {
        return "constructor";
    }

    if (declaration.name) {
        return typeChecker.getSymbolAtLocation(declaration.name!).name;
    }

    return undefined;
}

function getResolvedParameters(signature: ts.Signature, typeChecker: TypeChecker) {
    const declaration = signature.getDeclaration();
    const parameters: ResolvedFunctionParameter[] = [];

    for (let i = 0; i < declaration.parameters.length; ++i) {
        const parameter = declaration.parameters[i];
        const parameterSymbol = signature.parameters[i];
        const parameterType = typeChecker.getTypeOfSymbolAtLocation(parameterSymbol, parameter);

        parameters.push({
            initializer: parameter.initializer,
            name: parameterSymbol.name,
            optional: !!parameter.questionToken,
            type: parameterType,
            symbol: parameterSymbol,
            variadic: !!parameter.dotDotDotToken
        });
    }

    return parameters;
}
