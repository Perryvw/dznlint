// no identifiers used for bindings that are unknown

// import { Diagnostic } from "..";
// import { getRuleConfig } from "../config/util";
import { createDiagnosticsFactory } from "../diagnostic";
// import { ASTKinds, end_point, identifier, system } from "../grammar/parser";
import { RuleFactory } from "../linting-rule";
// import { nodeToSourceRange, systemBindings, systemInstances } from "../util";
// import { VisitorContext } from "../visitor";

export const unknownInstanceBinding = createDiagnosticsFactory();

export const no_unknown_instance_binding: RuleFactory = factoryContext => {
    void factoryContext;
    // const config = getRuleConfig("no_unknown_port_binding", factoryContext.userConfig);

    // if (config.isEnabled) {
    //     const createDiagnostic = (name: identifier, context: VisitorContext) =>
    //         unknownInstanceBinding(
    //             config.severity,
    //             `Binding to unknown instance '${name.text}'.`,
    //             context.source,
    //             nodeToSourceRange(name)
    //         );

    //     factoryContext.registerRule<system>(ASTKinds.system, (node, context) => {
    //         const diagnostics: Diagnostic[] = [];

    //         const instanceNames = new Set(systemInstances(node).map(i => i.name.text));

    //         for (const binding of systemBindings(node)) {
    //             if (isPropertyExpressionBinding(binding.left)) {
    //                 if (!instanceNames.has(binding.left.name.expression.text)) {
    //                     diagnostics.push(createDiagnostic(binding.left.name.expression, context));
    //                 }
    //             }

    //             if (isPropertyExpressionBinding(binding.right)) {
    //                 if (!instanceNames.has(binding.right.name.expression.text)) {
    //                     diagnostics.push(createDiagnostic(binding.right.name.expression, context));
    //                 }
    //             }
    //         }

    //         return diagnostics;
    //     });
    // }
};

export default no_unknown_instance_binding;

// function isPropertyExpressionBinding(
//     endpoint: end_point
// ): endpoint is end_point & { name: { expression: identifier } } {
//     return (
//         typeof endpoint !== "string" &&
//         !endpoint.dot &&
//         endpoint.name.kind === ASTKinds.property_expression &&
//         endpoint.name.expression?.kind === ASTKinds.identifier
//     );
// }
