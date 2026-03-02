using TypeGen.Core.SpecGeneration;

namespace Base2.Models;

public class BaseGenerationSpec : GenerationSpec
{
    public override void OnBeforeGeneration(OnBeforeGenerationArgs args)
    {
        // Cross-platform output path configuration
        string outputPath = Path.Combine("..", "..", "..", "client", "common", "src", "models");
        args.GeneratorOptions.BaseOutputDirectory = outputPath;
        
        base.OnBeforeGeneration(args);
    }

    public override void OnBeforeBarrelGeneration(OnBeforeBarrelGenerationArgs args)
    {
        AddBarrel(".", BarrelScope.Files); // adds one barrel file in the global TypeScript output directory containing only files from that directory
        AddBarrel(".", BarrelScope.Files | BarrelScope.Directories); // equivalent to AddBarrel("."); adds one barrel file in the global TypeScript output directory containing all files and directories from that directory

        // the following code, for each directory, creates a barrel file containing all files and directories from that directory
        IEnumerable<string> directories = GetAllDirectoriesRecursive(args.GeneratorOptions.BaseOutputDirectory)
            .Select(x => GetPathDiff(args.GeneratorOptions.BaseOutputDirectory, x))
            .OrderBy(x => x, StringComparer.Ordinal);

        foreach (string directory in directories)
        {
            AddBarrel(directory);
        }

        AddBarrel(".");
    }

    public override void OnAfterGeneration(OnAfterGenerationArgs args)
    {
        // Sort exports in all barrel files alphabetically
        SortBarrelExports(args.GeneratorOptions.BaseOutputDirectory);
        base.OnAfterGeneration(args);
    }

    private void SortBarrelExports(string directory)
    {
        // Find all index.ts barrel files
        string[] barrelFiles = Directory.GetFiles(directory, "index.ts", SearchOption.AllDirectories);

        foreach (string barrelFile in barrelFiles)
        {
            var lines = File.ReadAllLines(barrelFile);
            var header = new List<string>();
            var exports = new List<string>();
            var footer = new List<string>();
            
            bool inHeader = true;
            bool inExports = false;

            foreach (string line in lines)
            {
                string trimmed = line.Trim();
                
                if (trimmed.StartsWith("export "))
                {
                    inHeader = false;
                    inExports = true;
                    exports.Add(line);
                }
                else if (inExports && !string.IsNullOrWhiteSpace(trimmed))
                {
                    footer.Add(line);
                    inExports = false;
                }
                else if (inHeader)
                {
                    header.Add(line);
                }
                else if (!inExports)
                {
                    footer.Add(line);
                }
            }

            // Sort exports alphabetically
            exports.Sort(StringComparer.Ordinal);

            // Write back the sorted content
            var sortedContent = header.Concat(exports).Concat(footer);
            File.WriteAllLines(barrelFile, sortedContent);
        }
    }

    private string GetPathDiff(string pathFrom, string pathTo)
    {
        var pathFromUri = new Uri("file:///" + pathFrom?.Replace('\\', '/'));
        var pathToUri = new Uri("file:///" + pathTo?.Replace('\\', '/'));

        return pathFromUri.MakeRelativeUri(pathToUri).ToString();
    }

    private IEnumerable<string> GetAllDirectoriesRecursive(string directory)
    {
        var result = new List<string>();
        string[] subdirectories = Directory.GetDirectories(directory);

        if (!subdirectories.Any()) return result;

        // Sort subdirectories for consistent ordering across platforms
        Array.Sort(subdirectories, StringComparer.Ordinal);

        result.AddRange(subdirectories);

        foreach (string subdirectory in subdirectories)
        {
            result.AddRange(GetAllDirectoriesRecursive(subdirectory));
        }

        return result;
    }
}
