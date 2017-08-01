import {CompilerOptions} from "typescript";
import {DefaultWasmFileWriter} from "./default-wasm-file-writer";
import {WasmFileWriter} from "./wasm-file-writer";

export type OptimizationLevel = "0" | "1" | "2" | "3" | "z" | "s";

/**
 * Speedy JS Compiler Options
 */
export interface SpeedyJSCompilerOptions extends CompilerOptions {
    [option: string]: any;

    /**
     * Indicator if the emitted code and runtime should be memory safe or unsafe (truthy)
     * @default true
     */
    unsafe: boolean;

    /**
     * Indicator if the llvm output of the module (unoptimized, unlinked) should be emitted instead of the web assembly output.
     * Disables source file transformation
     * @default false
     */
    emitLLVM: boolean;

    /**
     * Indicator if the intermediate wast file representation should be saved in the output directory
     * @default false
     */
    saveWast: boolean;

    /**
     * If true, the bc file of the linked and optimized output is saved in the output directory
     * @default false
     */
    saveBc: boolean;

    /**
     * Indicator if the Binaryen Optimizer should be used on top of the LLVM optimizer
     * @default true
     */
    binaryenOpt: boolean;

    /**
     * The initially allocated memory (Heap + stack) in bytes.
     * @default 16mb 16*1024*1024
     */
    initialMemory: number;

    /**
     * Total memory to be allocated for the stack in bytes. Needs to be less than total Memory.
     * The stack can not be resized during runtime. Therefore, the defined size needs to be large enough to hold of the program.
     * Currently there is no check if a stack overflow happened.
     * @default 5mb (5*1024*1024)
     */
    totalStack: number;

    /**
     * Offset for global variables in bytes
     * @default 1024
     */
    globalBase: number;

    /**
     * Indicator if the heap should not be nuked (everything allocated on the heap is freed) prior of the exit of an entry function
     * @default true
     */
    disableHeapNukeOnExit: boolean;

    /**
     * Indicator if the gc should be exposed inside a module using speedy js functions using the speedyJsGc variable.
     * @default false
     */
    exposeGc: boolean;

    /**
     * Indicator if the gc symbol should be exposed and exported
     * @default false
     */
    exportGc: boolean;

    /**
     * The optimization level passed to llvm
     * @default "3"
     */
    optimizationLevel: OptimizationLevel;

    /**
     * The implementation that writes the wasm file
     */
    wasmFileWriter: WasmFileWriter;
}

/**
 * Uninitialized speedy js compiler options (all values might be absent)
 */
export type UninitializedSpeedyJSCompilerOptions = {
    [P in keyof SpeedyJSCompilerOptions]?: SpeedyJSCompilerOptions[P] | undefined;
};

/**
 * Initializes the compiler options with the default values
 * @param compilerOptions the compiler options to initialize
 * @return {SpeedyJSCompilerOptions} the initialized compiler options
 */
export function initializeCompilerOptions(compilerOptions: UninitializedSpeedyJSCompilerOptions): SpeedyJSCompilerOptions {
    const defaults = {
        unsafe: true,
        emitLLVM: false,
        saveWast: false,
        binaryenOpt: false,
        initialMemory: 16 * 1024 * 1024,
        totalStack: 5 * 1024 * 104,
        globalBase: 8,
        saveBc: false,
        disableHeapNukeOnExit: false,
        exposeGc: false,
        exportGc: false,
        optimizationLevel: "2",
        wasmFileWriter: new DefaultWasmFileWriter()
    };

    for (const key of Object.keys(defaults)) {
        compilerOptions[key] = typeof(compilerOptions[key]) === "undefined" ? (defaults as any)[key] : compilerOptions[key];
    }

    compilerOptions.strictNullChecks = true;
    compilerOptions.noImplicitAny = true; // speedy js cannot handle any
    compilerOptions.noImplicitReturns = true;
    compilerOptions.lib = compilerOptions.lib || ["lib.es2015.d.ts" ];

    return compilerOptions as SpeedyJSCompilerOptions;
}
