interface CommandLineArguments {
    configFile?: string;
    format: boolean;
    help: boolean;
    files: string[];
    includePaths: string[];
}

type ParsedCommandLineArguments =
    | { success: false; message: string }
    | { success: true; arguments: CommandLineArguments };

export function parseCommandLineArguments(args: string[]): ParsedCommandLineArguments {
    const result: CommandLineArguments = { format: false, help: false, files: [], includePaths: [] };

    let index = 0;
    while (args[index]) {
        if (args[index].startsWith("-")) {
            switch (args[index]) {
                case "--help":
                    return { success: true, arguments: { format: false, help: true, files: [], includePaths: [] } };
                case "--config-file":
                    result.configFile = args[index + 1];
                    index += 2;
                    break;
                case "--format":
                case "-f":
                case "-F":
                    result.format = true;
                    index++;
                    break;
                case "--include":
                case "-I":
                    result.includePaths.push(args[index + 1]);
                    index += 2;
                    break;
                default:
                    return {
                        success: false,
                        message: `Unknown cli option: ${args[index]}. See --help for supported arguments.`,
                    };
            }
        } else {
            result.files.push(...args.slice(index));
            break;
        }
    }

    return { success: true, arguments: result };
}
