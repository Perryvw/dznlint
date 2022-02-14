interface CommandLineArguments {
    configFile?: string;
    help: boolean;
    files: string[];
}

type ParsedCommandLineArguments =
    | { success: false; message: string }
    | { success: true; arguments: CommandLineArguments };

export function parseCommandLineArguments(args: string[]): ParsedCommandLineArguments {
    const result: CommandLineArguments = { help: false, files: [] };

    let index = 0;
    while (args[index]) {
        if (args[index].startsWith("--")) {
            switch (args[index]) {
                case "--help":
                    return { success: true, arguments: { help: true, files: [] } };
                case "--config-file":
                    result.configFile = args[index + 1];
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
