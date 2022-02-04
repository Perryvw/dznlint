// Type var = bla();
// if (var) {
//
// can be replaced with if (bla()) {

import { createDiagnosticsFactory } from "../diagnostic";

export const variableCanBeInlined = createDiagnosticsFactory();
