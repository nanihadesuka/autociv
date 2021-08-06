import tempfile
import shutil
import json
import os
import argparse

try:
    import gitignore_parser
    useGitIgnore = True
except:
    useGitIgnore = False


def msgExit(msg):
    print(msg)
    exit(1)


homeDir = os.path.expanduser("~")
modDir = os.getcwd()
modInfoFile = os.path.join(modDir, "mod.json")
modPyromodIgnoreFile = os.path.join(modDir, ".pyromodignore")

# Sanity check
if not os.path.isfile(modInfoFile):
    msgExit("Can't find mod.json in " + modInfoFile)


# Get mod info
with open(modInfoFile, "r") as file:
    modInfo = json.load(file)
    modVersion = "_v" + modInfo['version'] if "version" in modInfo else msgExit(
        "mod.json missing 'version' entry")
    modName = modInfo['name'] if "name" in modInfo else msgExit(
        "mod.json missing 'name' entry")

if os.path.isfile(os.path.join(modDir, modName + ".zip")):
    msgExit("Mod folder has zip inside. Remove to fix.")


def ignoreFilter(filePath):

    if useGitIgnore and os.path.isfile(filePath):
        matches = gitignore_parser.parse_gitignore(filePath)

        def ignore(path, entries):
            return [entry for entry in entries if matches(os.path.join(path, entry))]
    else:
        def ignore(path, names):
            return []
    return ignore


outFile = os.path.join(homeDir, "output", modName + modVersion)
outFileZip = outFile+".zip"
outFilePyromod = outFile+".zip"

# Make pyromod
with tempfile.TemporaryDirectory() as tempDir:
    stripped_mod = os.path.join(tempDir, modName)
    shutil.copytree(src=modDir,
                    dst=stripped_mod,
                    ignore=ignoreFilter(modPyromodIgnoreFile))
    shutil.make_archive(outFile, "zip", stripped_mod)
    shutil.move(outFile+".zip", outFile+".pyromod")

# Make zip from the pyromod
with tempfile.TemporaryDirectory() as tempDir:
    deepPath = os.path.join(tempDir, modName)
    os.makedirs(deepPath)
    deepZip = os.path.join(deepPath, modName+".zip")
    shutil.copyfile(outFile+".pyromod", deepZip)
    shutil.copyfile(modInfoFile, os.path.join(deepPath, "mod.json"))
    shutil.make_archive(outFile, "zip", tempDir)


os.environ["PYROMOD_MOD_VERSION"] = modVersion
os.environ["PYROMOD_PYROMOD_FILE_PATH"] = outFileZip
os.environ["PYROMOD_ZIP_FILE_PATH"] = outFilePyromod
