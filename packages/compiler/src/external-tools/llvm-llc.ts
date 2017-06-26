import * as debug from "debug";

import {execLLVM} from "./tools";

const LOG = debug("external-tools/llvm-llc");
const EXECUTABLE_NAME = "llc";
// tslint:disable-next-line:max-line-length
const DEFAULT_OPTIONS = ["-march=wasm32",  "-filetype=asm", "-asm-verbose=false", "-thread-model=single", "-combiner-global-alias-analysis=false", "-enable-emscripten-sjlj"];

/**
 * Generates the static assembly using llc
 * @param input the input file name (absolute)
 * @param sFileName the name of the resulting s file
 * @returns the name of the generated assembly file. The caller is responsible for deleting either the working directory
 * or the assembly file
 */
export function llc(input: string, sFileName: string): string {
    LOG(`Execute LLC for file ${input}`);

    LOG(execLLVM(EXECUTABLE_NAME, DEFAULT_OPTIONS.concat([input, "-o", sFileName])));

    return sFileName;
}
