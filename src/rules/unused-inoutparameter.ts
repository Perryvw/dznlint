// Only assigning inout parameter should hint making it out-only parameter

import { createDiagnosticsFactory } from "../diagnostic";

export const unusedInOutParameter = createDiagnosticsFactory();