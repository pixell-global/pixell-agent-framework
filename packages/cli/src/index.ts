#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { createApp } from './commands/create'
import { generateWorker } from './commands/generate'
import { deployApp } from './commands/deploy'
import { swapRuntime } from './commands/runtime'
import { installExtension, listExtensions, uninstallExtension } from './commands/extensions'
import { initConfig, showConfig, setStorageLimit, configAI } from './commands/config'
import { initStorage, showStorageStatus } from './commands/storage'
import { initSupabase, stopSupabase, statusSupabase, resetSupabase, migrationsSupabase, manageEnvironments, editSupabaseSettings } from './commands/supabase'
import { installDocker, dockerStatus, dockerStart } from './commands/docker'
import { startProject, startPafCoreAgentCommand } from './commands/start'
import { setupComplete } from './commands/setup-complete'
import { clonePafCoreAgent, updatePafCoreAgent, statusPafCoreAgent, removePafCoreAgent } from './commands/paf-core-agent'
import { startServices, stopServices, restartServices, statusServices, logsServices, scaleServices } from './commands/services'
import { checkSystemDependencies, ensureSystemDependencies } from './commands/system-dependencies'
import { 
  listFiles, 
  copyFiles, 
  moveFiles, 
  removeFiles, 
  makeDirectory, 
  touchFile, 
  catFile, 
  headFile, 
  tailFile, 
  findFiles, 
  grepFiles, 
  diskUsage, 
  statFile, 
  showTree, 
  zipFiles, 
  unzipFiles, 
  changeMode 
} from './commands/filesystem'

const program = new Command()

// CLI Header
console.log(chalk.blue.bold(`
╔═══════════════════════════════════════╗
║        🤖 Pixell CLI v0.5.0           ║
║   Agent Framework Developer Tools     ║
║     Phase 2: Aliases & Shortcuts     ║
╚═══════════════════════════════════════╝
`))

program
  .name('pxui')
  .description('CLI tools for Pixell Agent Framework development')
  .version('0.5.0')

// ============================================
// CORE PROJECT COMMANDS (Top-level)
// ============================================

program
  .command('create <app-name>')
  .description('Create a new Pixell agent application')
  .option('-t, --template <template>', 'App template to use', 'multi-agent')
  .option('-r, --runtime <runtime>', 'Agent runtime to use', 'aws-strand')
  .option('--no-install', 'Skip npm install')
  .option('--no-git', 'Skip git initialization')
  .action(createApp)

// Alias for create
program
  .command('new <app-name>')
  .description('Create a new Pixell agent application (alias for create)')
  .option('-t, --template <template>', 'App template to use', 'multi-agent')
  .option('-r, --runtime <runtime>', 'Agent runtime to use', 'aws-strand')
  .option('--no-install', 'Skip npm install')
  .option('--no-git', 'Skip git initialization')
  .action((name, options) => {
    console.log(chalk.cyan('💡 Tip: You can also use "pxui create" for this command'))
    createApp(name, options)
  })

program
  .command('generate-worker <name>')
  .description('Generate a new worker agent')
  .option('-d, --domain <domain>', 'Agent domain (e.g., social-media, analytics)', 'custom')
  .option('-t, --tools <tools>', 'Comma-separated list of tools', 'api')
  .option('-p, --protocol <protocol>', 'Communication protocol', 'a2a')
  .action(generateWorker)

// Alias for generate-worker
program
  .command('gen <name>')
  .description('Generate a new worker agent (alias for generate-worker)')
  .option('-d, --domain <domain>', 'Agent domain (e.g., social-media, analytics)', 'custom')
  .option('-t, --tools <tools>', 'Comma-separated list of tools', 'api')
  .option('-p, --protocol <protocol>', 'Communication protocol', 'a2a')
  .action((name, options) => {
    console.log(chalk.cyan('💡 Tip: You can also use "pxui generate-worker" for this command'))
    generateWorker(name, options)
  })

program
  .command('deploy')
  .description('Deploy your agent application')
  .option('-p, --platform <platform>', 'Deployment platform', 'docker')
  .option('-e, --env <env>', 'Environment to deploy to', 'production')
  .option('--dry-run', 'Show deployment plan without executing')
  .action(deployApp)

const startCmd = program
  .command('start')
  .description('Start the Pixell Agent Framework with comprehensive setup validation')
  .option('--env <environment>', 'Environment to use (defaults to local)', 'local')
  .action((options) => startProject({ env: options.env }))

startCmd
  .command('core-agent')
  .description('Start PAF Core Agent only')
  .action(() => startPafCoreAgentCommand())

// Alias for start
program
  .command('run')
  .description('Start the Pixell Agent Framework (alias for start)')
  .option('--env <environment>', 'Environment to use (defaults to local)', 'local')
  .action((options) => {
    console.log(chalk.cyan('💡 Tip: You can also use "pxui start" for this command'))
    startProject({ env: options.env })
  })

program
  .command('env')
  .description('Manage development environments (local, staging, production)')
  .action(manageEnvironments)

// ============================================
// CONFIG COMMAND GROUP (with aliases)
// ============================================

const configCmd = program
  .command('config')
  .alias('c')
  .description('Framework configuration management')

configCmd
  .command('init')
  .alias('i')
  .description('Initialize CLI configuration')
  .action(initConfig)

configCmd
  .command('show')
  .alias('s')
  .description('Show current configuration')
  .action(showConfig)

configCmd
  .command('storage')
  .alias('st')
  .description('Set storage limit for file uploads')
  .option('--limit <limit>', 'Storage limit in GB (1-1000)')
  .action((options) => setStorageLimit(options.limit))

configCmd
  .command('ai')
  .alias('a')
  .description('Configure AI runtime and credentials (AWS Strand or OpenAI)')
  .action(configAI)

// ============================================
// FILESYSTEM COMMAND GROUP (with aliases)
// ============================================

const fsCmd = program
  .command('fs')
  .alias('f')
  .description('Filesystem operations')

fsCmd
  .command('ls [path]')
  .alias('l')
  .description('List directory contents')
  .option('-a, --all', 'Show hidden files')
  .option('-l, --long', 'Use long listing format')
  .option('-h, --human-readable', 'Human readable file sizes')
  .option('-r, --reverse', 'Reverse sort order')
  .option('-R, --recursive', 'List subdirectories recursively')
  .option('-t', 'Sort by modification time')
  .option('-S', 'Sort by file size')
  .action((path, options) => {
    const sortOption = options.t ? 'date' : options.S ? 'size' : 'name'
    listFiles(path, {
      all: options.all,
      long: options.long,
      human: options.humanReadable,
      reverse: options.reverse,
      recursive: options.recursive,
      sort: sortOption
    })
  })

fsCmd
  .command('cp <source> <destination>')
  .description('Copy files or directories')
  .option('-r, --recursive', 'Copy directories recursively')
  .option('-f, --force', 'Force overwrite of destination files')
  .option('-p, --preserve', 'Preserve file timestamps')
  .option('-v, --verbose', 'Verbose output')
  .action((source, destination, options) => {
    copyFiles(source, destination, {
      recursive: options.recursive,
      force: options.force,
      preserve: options.preserve,
      verbose: options.verbose
    })
  })

fsCmd
  .command('mv <source> <destination>')
  .description('Move or rename files and directories')
  .option('-f, --force', 'Force overwrite of destination files')
  .option('-v, --verbose', 'Verbose output')
  .action((source, destination, options) => {
    moveFiles(source, destination, {
      force: options.force,
      verbose: options.verbose
    })
  })

fsCmd
  .command('rm <files...>')
  .description('Remove files and directories')
  .option('-r, --recursive', 'Remove directories recursively')
  .option('-f, --force', 'Force removal without confirmation')
  .option('-i, --interactive', 'Prompt before each removal')
  .option('-v, --verbose', 'Verbose output')
  .action((files, options) => {
    removeFiles(files, {
      recursive: options.recursive,
      force: options.force,
      interactive: options.interactive,
      verbose: options.verbose
    })
  })

fsCmd
  .command('mkdir <directory>')
  .description('Create directories')
  .option('-p, --parents', 'Create parent directories as needed')
  .option('-v, --verbose', 'Verbose output')
  .action((directory, options) => {
    makeDirectory(directory, {
      parents: options.parents,
      verbose: options.verbose
    })
  })

fsCmd
  .command('touch <file>')
  .description('Create empty file or update timestamp')
  .option('-v, --verbose', 'Verbose output')
  .action((file, options) => {
    touchFile(file, {
      verbose: options.verbose
    })
  })

fsCmd
  .command('cat <files...>')
  .description('Display file contents')
  .option('-n, --number', 'Number all output lines')
  .option('-E, --show-ends', 'Display $ at end of each line')
  .action((files, options) => {
    catFile(files, {
      numbered: options.number,
      showEnds: options.showEnds
    })
  })

fsCmd
  .command('head <file>')
  .description('Display first lines of a file')
  .option('-n, --lines <number>', 'Number of lines to display', '10')
  .action((file, options) => {
    headFile(file, {
      lines: parseInt(options.lines)
    })
  })

fsCmd
  .command('tail <file>')
  .description('Display last lines of a file')
  .option('-n, --lines <number>', 'Number of lines to display', '10')
  .option('-f, --follow', 'Follow file changes (output appended data)')
  .action((file, options) => {
    tailFile(file, {
      lines: parseInt(options.lines),
      follow: options.follow
    })
  })

fsCmd
  .command('find <pattern> [path]')
  .description('Search for files and directories')
  .option('-type <type>', 'File type filter (f=file, d=directory)')
  .option('-name', 'Search by filename pattern')
  .action((pattern, path, options) => {
    findFiles(pattern, path, {
      type: options.type as 'f' | 'd',
      name: options.name
    })
  })

fsCmd
  .command('grep <pattern> <files...>')
  .description('Search for patterns within files')
  .option('-i, --ignore-case', 'Ignore case distinctions')
  .option('-n, --line-number', 'Show line numbers')
  .option('-r, --recursive', 'Search directories recursively')
  .action((pattern, files, options) => {
    grepFiles(pattern, files, {
      ignoreCase: options.ignoreCase,
      lineNumbers: options.lineNumber,
      recursive: options.recursive
    })
  })

fsCmd
  .command('du [path]')
  .description('Display disk usage statistics')
  .option('-h, --human-readable', 'Human readable format')
  .option('-s, --summarize', 'Display only a total for each argument')
  .action((path, options) => {
    diskUsage(path, {
      human: options.humanReadable,
      summarize: options.summarize
    })
  })

fsCmd
  .command('stat <file>')
  .description('Display file or directory status')
  .action((file) => {
    statFile(file)
  })

fsCmd
  .command('tree [path]')
  .description('Display directory structure as a tree')
  .option('-L, --level <depth>', 'Maximum display depth')
  .option('-a, --all', 'Show all files including hidden')
  .action((path, options) => {
    showTree(path, {
      maxDepth: options.level ? parseInt(options.level) : undefined,
      showFiles: options.all
    })
  })

fsCmd
  .command('zip <archive> <files...>')
  .description('Create zip archive')
  .option('-v, --verbose', 'Verbose output')
  .option('-<number>', 'Compression level (0-9)', '6')
  .action((archive, files, options) => {
    zipFiles(archive, files, {
      verbose: options.verbose,
      compression: parseInt(options.number || '6')
    })
  })

fsCmd
  .command('unzip <archive> [path]')
  .description('Extract zip archive')
  .option('-v, --verbose', 'Verbose output')
  .action((archive, path, options) => {
    unzipFiles(archive, path, {
      verbose: options.verbose
    })
  })

fsCmd
  .command('chmod <mode> <files...>')
  .description('Change file permissions')
  .option('-R, --recursive', 'Change permissions recursively')
  .option('-v, --verbose', 'Verbose output')
  .action((mode, files, options) => {
    changeMode(mode, files, {
      recursive: options.recursive,
      verbose: options.verbose
    })
  })

// ============================================
// SUPABASE COMMAND GROUP (with aliases)
// ============================================

const supabaseCmd = program
  .command('supabase')
  .alias('sb')
  .description('Supabase database and services management')

supabaseCmd
  .command('init')
  .alias('i')
  .description('Complete Supabase setup (database, auth, storage)')
  .option('--env <environment>', 'Configure Supabase for specific environment')
  .option('--local', 'Use local Supabase only')
  .option('--skip-migrations', 'Skip running migrations')
  .option('--skip-auth', 'Skip authentication setup')
  .option('--skip-storage', 'Skip storage setup')
  .action((options) => initSupabase(options.env))

supabaseCmd
  .command('status')
  .alias('st')
  .description('Check Supabase service status')
  .option('--env <environment>', 'Check status for specific environment')
  .action((options) => statusSupabase(options.env))

supabaseCmd
  .command('stop')
  .description('Stop local Supabase services')
  .option('--env <environment>', 'Target specific environment (local only)')
  .action((options) => stopSupabase(options.env))

supabaseCmd
  .command('reset')
  .alias('r')
  .description('Reset local Supabase database')
  .option('--env <environment>', 'Target specific environment (local only)')
  .action((options) => resetSupabase(options.env))

supabaseCmd
  .command('migrations')
  .alias('m')
  .description('Manage database migrations (status, apply, create)')
  .option('--env <environment>', 'Use specific environment for migrations')
  .action((options) => migrationsSupabase(options.env))

supabaseCmd
  .command('edit')
  .alias('e')
  .description('Edit Supabase settings for managed environments')
  .option('--env <environment>', 'Edit settings for specific environment')
  .action((options) => editSupabaseSettings(options.env))

// ============================================
// STORAGE COMMAND GROUP (with aliases)
// ============================================

const storageCmd = program
  .command('storage')
  .alias('st')
  .description('File storage management')

storageCmd
  .command('init')
  .alias('i')
  .description('Set up file storage (local, Supabase, S3, or database)')
  .option('--force', 'Force reconfiguration of existing storage')
  .action(initStorage)

storageCmd
  .command('status')
  .alias('s')
  .description('Show current storage configuration')
  .action(showStorageStatus)

// ============================================
// EXTENSIONS COMMAND GROUP (with aliases)
// ============================================

const extensionsCmd = program
  .command('extensions')
  .alias('ext')
  .description('Extension management')

extensionsCmd
  .command('list')
  .alias('ls')
  .description('List available and installed extensions')
  .option('--type <type>', 'Filter by extension type')
  .option('--installed', 'Show only installed extensions')
  .action(listExtensions)

extensionsCmd
  .command('install <extension>')
  .alias('i')
  .description('Install an extension')
  .option('--version <version>', 'Specific version to install')
  .action(installExtension)

extensionsCmd
  .command('uninstall <extension>')
  .alias('rm')
  .description('Uninstall an extension')
  .action(uninstallExtension)

// ============================================
// DOCKER COMMAND GROUP (with aliases)
// ============================================

const dockerCmd = program
  .command('docker')
  .alias('d')
  .description('Docker management')

dockerCmd
  .command('install')
  .alias('i')
  .description('Install Docker (required for Supabase local development)')
  .action(installDocker)

dockerCmd
  .command('status')
  .alias('st')
  .description('Check Docker installation and running status (with option to start)')
  .action(dockerStatus)

dockerCmd
  .command('start')
  .description('Start Docker if installed (quick start without status check)')
  .action(dockerStart)

// ============================================
// SETUP COMMANDS (Enhanced)
// ============================================

program
  .command('setup:complete')
  .description('Complete automated setup - installs everything automatically')
  .option('--skip-clone', 'Skip cloning PAF Core Agent')
  .option('--skip-docker', 'Skip Docker setup')
  .option('--skip-env', 'Skip environment creation')
  .option('--environment <env>', 'Target environment', 'local')
  .action(setupComplete)

program
  .command('check-deps')
  .description('Check system dependencies (Docker, Python, Git, etc.)')
  .action(async () => {
    await checkSystemDependencies()
  })

program
  .command('install-deps')
  .description('Install missing system dependencies automatically')
  .action(ensureSystemDependencies)

// ============================================
// PAF CORE AGENT COMMAND GROUP
// ============================================

const pafCmd = program
  .command('paf-core-agent')
  .alias('paf')
  .description('PAF Core Agent repository management')

pafCmd
  .command('clone')
  .alias('c')
  .description('Clone PAF Core Agent repository')
  .option('--branch <branch>', 'Git branch to clone', 'main')
  .option('--force', 'Force overwrite existing directory')
  .option('--dev', 'Setup development environment')
  .action(clonePafCoreAgent)

pafCmd
  .command('update')
  .alias('u')
  .description('Update PAF Core Agent repository')
  .option('--branch <branch>', 'Git branch to update')
  .action(updatePafCoreAgent)

pafCmd
  .command('status')
  .alias('st')
  .description('Check PAF Core Agent status')
  .action(statusPafCoreAgent)

pafCmd
  .command('remove')
  .alias('rm')
  .description('Remove PAF Core Agent repository')
  .action(removePafCoreAgent)

// ============================================
// SERVICES COMMAND GROUP
// ============================================

const servicesCmd = program
  .command('services')
  .alias('svc')
  .description('Manage all Pixell services (Docker Compose)')

servicesCmd
  .command('start')
  .alias('up')
  .description('Start all services')
  .option('--environment <env>', 'Target environment', 'local')
  .option('--no-detached', 'Run in foreground')
  .option('--services <services>', 'Specific services to start (comma-separated)')
  .action((options) => startServices({
    environment: options.environment,
    detached: options.detached,
    services: options.services ? options.services.split(',') : undefined
  }))

servicesCmd
  .command('stop')
  .alias('down')
  .description('Stop all services')
  .option('--environment <env>', 'Target environment', 'local')
  .action((options) => stopServices({ environment: options.environment }))

servicesCmd
  .command('restart')
  .alias('r')
  .description('Restart all services')
  .option('--environment <env>', 'Target environment', 'local')
  .action((options) => restartServices({ environment: options.environment }))

servicesCmd
  .command('status')
  .alias('st')
  .description('Check status of all services')
  .action(statusServices)

servicesCmd
  .command('logs')
  .alias('l')
  .description('Show service logs')
  .option('--service <service>', 'Specific service to show logs for')
  .option('--follow', 'Follow log output')
  .action((options) => logsServices({
    service: options.service,
    follow: options.follow
  }))

servicesCmd
  .command('scale <service> <replicas>')
  .alias('s')
  .description('Scale a service to specified number of replicas')
  .action(scaleServices)

// ============================================
// RUNTIME COMMAND GROUP (with aliases)
// ============================================

const runtimeCmd = program
  .command('runtime')
  .alias('rt')
  .description('Agent runtime management')

runtimeCmd
  .command('swap')
  .alias('s')
  .description('Swap the agent runtime')
  .option('--from <from>', 'Current runtime')
  .option('--to <to>', 'Target runtime')
  .option('--backup', 'Create backup before swapping')
  .action(swapRuntime)

// ============================================
// POPULAR SHORTCUTS (Top-level)
// ============================================

// Popular filesystem shortcuts
program
  .command('ll [path]')
  .description('List directory contents in long format (shortcut for fs ls -l)')
  .action((path) => {
    console.log(chalk.cyan('💡 Shortcut for: pxui fs ls -l'))
    listFiles(path, {
      all: false,
      long: true,
      human: true,
      reverse: false,
      recursive: false,
      sort: 'name'
    })
  })

program
  .command('la [path]')
  .description('List all files including hidden (shortcut for fs ls -a)')
  .action((path) => {
    console.log(chalk.cyan('💡 Shortcut for: pxui fs ls -a'))
    listFiles(path, {
      all: true,
      long: false,
      human: false,
      reverse: false,
      recursive: false,
      sort: 'name'
    })
  })

program
  .command('tree [path]')
  .description('Show directory tree (shortcut for fs tree)')
  .option('-L, --level <depth>', 'Maximum display depth')
  .option('-a, --all', 'Show all files including hidden')
  .action((path, options) => {
    console.log(chalk.cyan('💡 Shortcut for: pxui fs tree'))
    showTree(path, {
      maxDepth: options.level ? parseInt(options.level) : undefined,
      showFiles: options.all
    })
  })

// Configuration shortcuts
program
  .command('init')
  .description('Initialize CLI configuration (shortcut for config init)')
  .action(() => {
    console.log(chalk.cyan('💡 Shortcut for: pxui config init'))
    initConfig()
  })

program
  .command('status')
  .description('Show system status (config, storage, docker, supabase)')
  .action(async () => {
    console.log(chalk.cyan('💡 Combined status check'))
    console.log(chalk.blue('\n📋 Configuration Status:'))
    await showConfig()
    console.log(chalk.blue('\n💾 Storage Status:'))
    await showStorageStatus()
    console.log(chalk.blue('\n🐳 Docker Status:'))
    await dockerStatus()
    console.log(chalk.blue('\n🗄️ Supabase Status:'))
    await statusSupabase()
  })

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================

// Keep some popular commands as top-level for familiarity
program
  .command('ls [path]')
  .description('List directory contents (alias for fs ls)')
  .option('-a, --all', 'Show hidden files')
  .option('-l, --long', 'Use long listing format')
  .option('-h, --human-readable', 'Human readable file sizes')
  .option('-r, --reverse', 'Reverse sort order')
  .option('-R, --recursive', 'List subdirectories recursively')
  .option('-t', 'Sort by modification time')
  .option('-S', 'Sort by file size')
  .action((path, options) => {
    console.log(chalk.yellow('Note: Consider using "pxui fs ls" or "pxui f l" for the organized command structure'))
    const sortOption = options.t ? 'date' : options.S ? 'size' : 'name'
    listFiles(path, {
      all: options.all,
      long: options.long,
      human: options.humanReadable,
      reverse: options.reverse,
      recursive: options.recursive,
      sort: sortOption
    })
  })

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.green('\n🚀 Welcome to Pixell CLI v0.5.0!'))
  console.log(chalk.magenta('✨ Phase 2: Now with aliases and shortcuts!'))
  console.log(chalk.cyan('\n📋 Organized command structure:'))
  console.log(chalk.white('   Core Commands:'))
  console.log(chalk.cyan('   pxui create    - Create new agent applications'))
  console.log(chalk.cyan('   pxui start     - Start the framework'))
  console.log(chalk.cyan('   pxui deploy    - Deploy applications'))
  console.log(chalk.cyan('   pxui env       - Manage environments'))
  console.log(chalk.white('\n   Service Groups (with aliases):'))
  console.log(chalk.cyan('   pxui config (c)    - Framework configuration'))
  console.log(chalk.cyan('   pxui fs (f)        - Filesystem operations'))
  console.log(chalk.cyan('   pxui supabase (sb) - Database management'))
  console.log(chalk.cyan('   pxui storage (st)  - Storage management'))
  console.log(chalk.cyan('   pxui extensions (ext) - Extension management'))
  console.log(chalk.cyan('   pxui docker (d)    - Docker management'))
  console.log(chalk.cyan('   pxui runtime (rt)  - Runtime management'))
  console.log(chalk.cyan('   pxui paf-core-agent (paf) - PAF Core Agent management'))
  console.log(chalk.cyan('   pxui services (svc) - Service orchestration'))
  console.log(chalk.white('\n   🚀 Popular Shortcuts:'))
  console.log(chalk.green('   pxui new       - Create app (alias for create)'))
  console.log(chalk.green('   pxui gen       - Generate worker (alias for generate-worker)'))
  console.log(chalk.green('   pxui run       - Start framework (alias for start)'))
  console.log(chalk.green('   pxui ll        - Long list (fs ls -l)'))
  console.log(chalk.green('   pxui la        - List all (fs ls -a)'))
  console.log(chalk.green('   pxui tree      - Directory tree (fs tree)'))
  console.log(chalk.green('   pxui init      - Initialize config (config init)'))
  console.log(chalk.green('   pxui status    - Combined system status'))
  console.log(chalk.green('   pxui setup:complete - Complete automated setup'))
  console.log(chalk.yellow('\n   💡 Examples:'))
  console.log(chalk.gray('   pxui c s       - Show config (config show)'))
  console.log(chalk.gray('   pxui f l       - List files (fs ls)'))
  console.log(chalk.gray('   pxui sb st     - Supabase status'))
  console.log(chalk.gray('   pxui ext ls    - List extensions'))
  console.log(chalk.gray('   pxui paf c     - Clone PAF Core Agent'))
  console.log(chalk.gray('   pxui svc up    - Start all services'))
  console.log(chalk.yellow('\n   Use "pxui <command> --help" for detailed options'))
  process.exit(0)
}

// Parse arguments
program.parse() 