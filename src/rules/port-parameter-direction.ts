// always: Annotate port function parameters with provided or required
// never: Annotate non-port function parameters with provided or required

import * as ast from "../grammar/ast";
import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
import { RuleFactory } from "../linting-rule";
import { TypeKind } from "../semantics/type-checker";

export const missingPortParameterDirection = createDiagnosticsFactory();
export const invalidParameterDirection = createDiagnosticsFactory();

export const parameter_direction: RuleFactory = factoryContext => {
    const config = getRuleConfig("port_parameter_direction", factoryContext.userConfig);

    if (config.isEnabled) {
        factoryContext.registerRule<ast.FunctionDefinition>(ast.SyntaxKind.FunctionDefinition, (node, context) => {
            const diagnostics = [];

            for (const param of node.parameters) {
                // Check if parameter is a port
                const paramType = context.typeChecker.typeOfNode(param.type);
                if (paramType.kind === TypeKind.Interface) {
                    // Ports must have provides or requires specified
                    if (!param.direction || !isProvidesOrRequires(param.direction.text)) {
                        diagnostics.push(
                            missingPortParameterDirection(
                                config.severity,
                                `Port parameters should be marked as either 'provides' or 'requires'`,
                                context.source,
                                param.position
                            )
                        );
                    }
                } else {
                    // Non-ports must NOT have provides or requires specified
                    if (param.direction && isProvidesOrRequires(param.direction.text)) {
                        diagnostics.push(
                            invalidParameterDirection(
                                config.severity,
                                `Parameter ${param.name.text} is not an interface type and cannot be marked 'provides' or 'requires'`,
                                context.source,
                                param.position
                            )
                        );
                    }
                }
            }

            return diagnostics;
        });
    }
};

export default parameter_direction;

function isProvidesOrRequires(str: string): boolean {
    return str === "provides" || str === "requires";
}
