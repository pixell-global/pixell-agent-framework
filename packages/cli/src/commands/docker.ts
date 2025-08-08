import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { execSync } from 'child_process'
import execa from 'execa'
import os from 'os'

/**
 * Docker Installation and Management Commands
 * Handles automatic Docker installation across platforms
 */

export async function checkDockerInstallation(): Promise<boolean> {
  try {
    await execa('docker', ['--version'])
    return true
  } catch {
    return false
  }
}

export async function checkDockerEngineRunning(): Promise<boolean> {
  try {
    await execa('docker', ['ps'])
    return true
  } catch {
    return false
  }
}

export async function checkDockerContainersRunning(): Promise<boolean> {
  try {
    // Check if docker-compose.yml exists
    const fs = require('fs')
    const path = require('path')
    
    const composeFiles = ['docker-compose.yml', 'docker-compose.yaml']
    let composeFileExists = false
    
    for (const file of composeFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        composeFileExists = true
        break
      }
    }
    
    if (composeFileExists) {
      // Use docker-compose ps to check running containers
      const result = await execa('docker-compose', ['ps', '-q'])
      if (result.stdout.trim()) {
        // Check if any containers are actually running (not just created)
        const runningResult = await execa('docker-compose', ['ps', '--filter', 'status=running', '-q'])
        return runningResult.stdout.trim().length > 0
      }
    } else {
      // Fallback to docker ps for any running containers
      const result = await execa('docker', ['ps', '-q'])
      return result.stdout.trim().length > 0
    }
    
    return false
  } catch {
    return false
  }
}

export async function installDocker(): Promise<void> {
  const spinner = ora('🐳 Checking Docker installation...').start()
  
  try {
    // Check if Docker is already installed
    if (await checkDockerInstallation()) {
      spinner.info('✅ Docker is already installed')
      
      // Check if Docker engine is running
      if (await checkDockerEngineRunning()) {
        // Check if project containers are running
        if (await checkDockerContainersRunning()) {
          spinner.succeed('✅ Docker is installed and containers are running')
          return
        } else {
          spinner.warn('⚠️  Docker is running but project containers are not started')
          console.log(chalk.yellow('\n💡 Start your project containers:'))
          console.log(chalk.white('   docker-compose up -d'))
          return
        }
      } else {
        spinner.warn('⚠️  Docker is installed but not running')
        await promptStartDocker()
        return
      }
    }

    spinner.text = '⠋ Docker not found. Starting installation...'
    
    const platform = os.platform()
    const arch = os.arch()
    
    console.log(chalk.blue(`\n🔍 Detected platform: ${platform} (${arch})`))
    
    const confirmation = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'install',
        message: 'Docker is required for Supabase local development. Install Docker automatically?',
        default: true
      }
    ])
    
    if (!confirmation.install) {
      spinner.info('ℹ️  Docker installation skipped')
      showManualInstallInstructions()
      return
    }
    
    await performDockerInstallation(platform, spinner)
    
  } catch (error) {
    spinner.fail('❌ Docker installation failed')
    console.error(chalk.red(`Error: ${error}`))
    showManualInstallInstructions()
    throw error
  }
}

async function performDockerInstallation(platform: string, spinner: any): Promise<void> {
  switch (platform) {
    case 'darwin':
      await installDockerMacOS(spinner)
      break
    case 'win32':
      await installDockerWindows(spinner)
      break
    case 'linux':
      await installDockerLinux(spinner)
      break
    default:
      spinner.fail(`❌ Unsupported platform: ${platform}`)
      showManualInstallInstructions()
      throw new Error(`Docker auto-installation not supported on ${platform}`)
  }
}

async function installDockerMacOS(spinner: any): Promise<void> {
  try {
    // Try Homebrew first
    try {
      await execa('brew', ['--version'])
      spinner.text = '⠋ Installing Docker via Homebrew...'
      await execa('brew', ['install', '--cask', 'docker'])
      spinner.succeed('✅ Docker Desktop installed via Homebrew')
      
      console.log(chalk.yellow('\n⚠️  Important: Please start Docker Desktop manually'))
      console.log(chalk.gray('   1. Open Docker Desktop from Applications'))
      console.log(chalk.gray('   2. Wait for Docker to start (you\'ll see the whale icon in the menu bar)'))
      console.log(chalk.gray('   3. Then run: npm run pixell docker-status'))
      
      return
    } catch {
      // Homebrew not available, try direct download
      spinner.text = '⠋ Homebrew not found. Downloading Docker Desktop...'
      
      const arch = os.arch()
      const downloadUrl = arch === 'arm64' 
        ? 'https://desktop.docker.com/mac/main/arm64/Docker.dmg'
        : 'https://desktop.docker.com/mac/main/amd64/Docker.dmg'
      
      console.log(chalk.blue(`\n📥 Downloading Docker Desktop for macOS (${arch})...`))
      console.log(chalk.gray(`   URL: ${downloadUrl}`))
      
      // Download using curl
      await execa('curl', ['-L', '-o', '/tmp/Docker.dmg', downloadUrl])
      
      console.log(chalk.blue('\n📦 Please complete the installation manually:'))
      console.log(chalk.gray('   1. Open /tmp/Docker.dmg'))
      console.log(chalk.gray('   2. Drag Docker to Applications folder'))
      console.log(chalk.gray('   3. Start Docker Desktop'))
      console.log(chalk.gray('   4. Run: npm run pixell docker-status'))
      
      spinner.succeed('✅ Docker Desktop downloaded to /tmp/Docker.dmg')
    }
  } catch (error) {
    spinner.fail('❌ Failed to install Docker on macOS')
    throw error
  }
}

async function installDockerWindows(spinner: any): Promise<void> {
  try {
    // Try Chocolatey first
    try {
      await execa('choco', ['--version'])
      spinner.text = '⠋ Installing Docker via Chocolatey...'
      await execa('choco', ['install', 'docker-desktop', '-y'])
      spinner.succeed('✅ Docker Desktop installed via Chocolatey')
      
      console.log(chalk.yellow('\n⚠️  Important: Please restart your computer and start Docker Desktop'))
      return
    } catch {
      // Try Scoop
      try {
        await execa('scoop', ['--version'])
        spinner.text = '⠋ Installing Docker via Scoop...'
        await execa('scoop', ['install', 'docker'])
        spinner.succeed('✅ Docker installed via Scoop')
        return
      } catch {
        // Scoop not available, manual download
        spinner.text = '⠋ Downloading Docker Desktop for Windows...'
        
        const downloadUrl = 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'
        console.log(chalk.blue('\n📥 Downloading Docker Desktop for Windows...'))
        console.log(chalk.gray(`   URL: ${downloadUrl}`))
        
        console.log(chalk.blue('\n📦 Please complete the installation manually:'))
        console.log(chalk.gray('   1. Download Docker Desktop from: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'))
        console.log(chalk.gray('   2. Run the installer as Administrator'))
        console.log(chalk.gray('   3. Restart your computer'))
        console.log(chalk.gray('   4. Start Docker Desktop'))
        console.log(chalk.gray('   5. Run: npm run pixell docker-status'))
        
        spinner.succeed('✅ Docker Desktop download instructions provided')
      }
    }
  } catch (error) {
    spinner.fail('❌ Failed to install Docker on Windows')
    throw error
  }
}

async function installDockerLinux(spinner: any): Promise<void> {
  try {
    spinner.text = '⠋ Installing Docker on Linux...'
    
    // Detect Linux distribution
    let distro = 'unknown'
    try {
      const releaseInfo = execSync('cat /etc/os-release', { encoding: 'utf-8' })
      if (releaseInfo.includes('Ubuntu') || releaseInfo.includes('Debian')) {
        distro = 'debian'
      } else if (releaseInfo.includes('CentOS') || releaseInfo.includes('RHEL') || releaseInfo.includes('Fedora')) {
        distro = 'rhel'
      } else if (releaseInfo.includes('Arch')) {
        distro = 'arch'
      }
    } catch {}
    
    switch (distro) {
      case 'debian':
        await installDockerDebian(spinner)
        break
      case 'rhel':
        await installDockerRHEL(spinner)
        break
      case 'arch':
        await installDockerArch(spinner)
        break
      default:
        // Generic installation using the convenience script
        spinner.text = '⠋ Using Docker convenience script...'
        await execa('curl', ['-fsSL', 'https://get.docker.com', '-o', '/tmp/get-docker.sh'])
        await execa('sudo', ['sh', '/tmp/get-docker.sh'])
        break
    }
    
    // Post-installation setup
    spinner.text = '⠋ Configuring Docker...'
    try {
      await execa('sudo', ['systemctl', 'start', 'docker'])
      await execa('sudo', ['systemctl', 'enable', 'docker'])
      await execa('sudo', ['usermod', '-aG', 'docker', process.env.USER || 'user'])
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not configure Docker service automatically'))
    }
    
    spinner.succeed('✅ Docker installed on Linux')
    
    console.log(chalk.yellow('\n⚠️  Important: Please log out and log back in (or restart) for Docker permissions to take effect'))
    console.log(chalk.gray('   Then run: npm run pixell docker-status'))
    
  } catch (error) {
    spinner.fail('❌ Failed to install Docker on Linux')
    throw error
  }
}

async function installDockerDebian(spinner: any): Promise<void> {
  // Install Docker on Debian/Ubuntu
  await execa('sudo', ['apt-get', 'update'])
  await execa('sudo', ['apt-get', 'install', '-y', 'ca-certificates', 'curl', 'gnupg', 'lsb-release'])
  await execa('sudo', ['mkdir', '-p', '/etc/apt/keyrings'])
  
  // Add Docker GPG key
  execSync('curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg', { stdio: 'inherit' })
  
  // Add Docker repository
  execSync('echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null', { stdio: 'inherit' })
  
  await execa('sudo', ['apt-get', 'update'])
  await execa('sudo', ['apt-get', 'install', '-y', 'docker-ce', 'docker-ce-cli', 'containerd.io', 'docker-buildx-plugin', 'docker-compose-plugin'])
}

async function installDockerRHEL(spinner: any): Promise<void> {
  await execa('sudo', ['yum', 'install', '-y', 'yum-utils'])
  await execa('sudo', ['yum-config-manager', '--add-repo', 'https://download.docker.com/linux/centos/docker-ce.repo'])
  await execa('sudo', ['yum', 'install', '-y', 'docker-ce', 'docker-ce-cli', 'containerd.io', 'docker-buildx-plugin', 'docker-compose-plugin'])
}

async function installDockerArch(spinner: any): Promise<void> {
  await execa('sudo', ['pacman', '-S', '--noconfirm', 'docker', 'docker-compose'])
}

async function startDocker(): Promise<void> {
  const spinner = ora('🚀 Starting Docker...').start()
  const platform = os.platform()
  
  try {
    if (platform === 'darwin') {
      // macOS - try to start Docker Desktop
      spinner.text = '⠋ Starting Docker Desktop on macOS...'
      try {
        await execa('open', ['-a', 'Docker'])
        spinner.succeed('✅ Docker Desktop started')
        console.log(chalk.gray('   Waiting for Docker to fully initialize...'))
      } catch (error) {
        spinner.warn('⚠️  Could not start Docker Desktop automatically')
        console.log(chalk.yellow('   Please start Docker Desktop manually from Applications folder'))
      }
    } else if (platform === 'win32') {
      // Windows - try to start Docker Desktop
      spinner.text = '⠋ Starting Docker Desktop on Windows...'
      try {
        await execa('powershell', ['-Command', 'Start-Process "Docker Desktop"'])
        spinner.succeed('✅ Docker Desktop started')
        console.log(chalk.gray('   Waiting for Docker to fully initialize...'))
      } catch (error) {
        spinner.warn('⚠️  Could not start Docker Desktop automatically')
        console.log(chalk.yellow('   Please start Docker Desktop manually from the Start menu'))
      }
    } else {
      // Linux - try to start Docker service
      spinner.text = '⠋ Starting Docker service on Linux...'
      try {
        await execa('sudo', ['systemctl', 'start', 'docker'])
        spinner.succeed('✅ Docker service started')
      } catch (error) {
        try {
          await execa('sudo', ['service', 'docker', 'start'])
          spinner.succeed('✅ Docker service started')
        } catch (error2) {
          spinner.fail('❌ Could not start Docker service')
          console.log(chalk.yellow('   Please start Docker manually:'))
          console.log(chalk.white('   • sudo systemctl start docker'))
          console.log(chalk.white('   • sudo service docker start'))
          throw new Error('Failed to start Docker service')
        }
      }
    }
  } catch (error) {
    spinner.fail('❌ Failed to start Docker')
    throw error
  }
}

async function promptStartDocker(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'start',
      message: 'Would you like help starting Docker?',
      default: true
    }
  ])
  
  if (answers.start) {
    console.log(chalk.blue('\n🚀 Starting Docker:'))
    
    const platform = os.platform()
    if (platform === 'darwin' || platform === 'win32') {
      console.log(chalk.gray('   • Open Docker Desktop application'))
      console.log(chalk.gray('   • Wait for the whale icon to appear in the system tray/menu bar'))
    } else {
      console.log(chalk.gray('   • Run: sudo systemctl start docker'))
      console.log(chalk.gray('   • Or: sudo service docker start'))
    }
    
    console.log(chalk.gray('   • Then verify with: npm run pixell docker-status'))
  }
}

export async function dockerStart(): Promise<void> {
  console.log(chalk.blue.bold('\n🚀 Starting Docker'))
  console.log(chalk.blue('='.repeat(25)))
  
  // Check if Docker is installed first
  const isInstalled = await checkDockerInstallation()
  if (!isInstalled) {
    console.log(chalk.red('❌ Docker is not installed'))
    console.log(chalk.yellow('\n💡 Install Docker first:'))
    console.log(chalk.white('   npm run pixell docker-install'))
    return
  }
  
  // Check if Docker engine is running
  const isEngineRunning = await checkDockerEngineRunning()
  if (isEngineRunning) {
    // Check if project containers are running
    const areContainersRunning = await checkDockerContainersRunning()
    if (areContainersRunning) {
      console.log(chalk.green('✅ Docker is running and containers are active'))
    } else {
      console.log(chalk.green('✅ Docker engine is running'))
      console.log(chalk.yellow('⚠️  Project containers are not running'))
      console.log(chalk.yellow('\n💡 Start your project containers:'))
      console.log(chalk.white('   docker-compose up -d'))
    }
    
    console.log(chalk.blue('\n📊 Quick Docker Info:'))
    
    try {
      const versionResult = await execa('docker', ['--version'])
      console.log(chalk.gray(`   ${versionResult.stdout}`))
      
      const infoResult = await execa('docker', ['info', '--format', 'json'])
      const info = JSON.parse(infoResult.stdout)
      console.log(chalk.gray(`   Containers: ${info.Containers || 0} (${info.ContainersRunning || 0} running)`))
    } catch {}
    
    if (areContainersRunning) {
      console.log(chalk.green('\n🎉 Docker and containers are ready!'))
    } else {
      console.log(chalk.yellow('\n⚠️  Start containers with: docker-compose up -d'))
    }
    return
  }
  
  // Docker is installed but not running - start it
  console.log(chalk.yellow('⚠️  Docker is installed but not running'))
  
  try {
    await startDocker()
    
    // Wait and verify
    console.log(chalk.gray('\n⏳ Waiting for Docker to start...'))
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const isNowRunning = await checkDockerEngineRunning()
    if (isNowRunning) {
      const areContainersRunning = await checkDockerContainersRunning()
      if (areContainersRunning) {
        console.log(chalk.green('✅ Docker started successfully and containers are running!'))
        console.log(chalk.green('🎉 Docker is ready for development!'))
      } else {
        console.log(chalk.green('✅ Docker engine started successfully!'))
        console.log(chalk.yellow('💡 Start your project containers:'))
        console.log(chalk.white('   docker-compose up -d'))
      }
    } else {
      console.log(chalk.yellow('⚠️  Docker may still be starting. Please wait a moment.'))
      console.log(chalk.gray('   Run "npm run pixell docker-status" to check again'))
    }
  } catch (error) {
    console.log(chalk.red('❌ Failed to start Docker automatically'))
    console.log(chalk.yellow('\n💡 Please start Docker manually:'))
    
    const platform = os.platform()
    if (platform === 'darwin' || platform === 'win32') {
      console.log(chalk.white('   • Open Docker Desktop application'))
    } else {
      console.log(chalk.white('   • sudo systemctl start docker'))
      console.log(chalk.white('   • sudo service docker start'))
    }
  }
}

export async function dockerStatus(): Promise<void> {
  console.log(chalk.blue.bold('\n🐳 Docker Status Check'))
  console.log(chalk.blue('='.repeat(30)))
  
  // Check if Docker is installed
  const isInstalled = await checkDockerInstallation()
  if (!isInstalled) {
    console.log(chalk.red('❌ Docker is not installed'))
    console.log(chalk.yellow('\n💡 Install Docker:'))
    console.log(chalk.white('   npm run pixell docker-install'))
    return
  }
  
  console.log(chalk.green('✅ Docker is installed'))
  
  // Check Docker version
  try {
    const versionResult = await execa('docker', ['--version'])
    console.log(chalk.gray(`   ${versionResult.stdout}`))
  } catch {}
  
  // Check if Docker engine is running
  const isEngineRunning = await checkDockerEngineRunning()
  if (!isEngineRunning) {
    console.log(chalk.red('❌ Docker engine is not running'))
    
    const startPrompt = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startDocker',
        message: 'Would you like to start Docker now?',
        default: true
      }
    ])
    
    if (startPrompt.startDocker) {
      await startDocker()
      
      // Check again after attempting to start
      console.log(chalk.gray('\n⏳ Checking Docker status...'))
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const isNowRunning = await checkDockerEngineRunning()
      if (isNowRunning) {
        console.log(chalk.green('✅ Docker engine is now running!'))
      } else {
        console.log(chalk.yellow('⚠️  Docker may still be starting. Please wait a moment and try again.'))
        return
      }
    } else {
      console.log(chalk.yellow('\n💡 To start Docker manually:'))
      
      const platform = os.platform()
      if (platform === 'darwin' || platform === 'win32') {
        console.log(chalk.white('   • Open Docker Desktop application'))
      } else {
        console.log(chalk.white('   • sudo systemctl start docker'))
        console.log(chalk.white('   • sudo service docker start'))
      }
      return
    }
  }
  
  console.log(chalk.green('✅ Docker engine is running'))
  
  // Check if project containers are running
  const areContainersRunning = await checkDockerContainersRunning()
  if (areContainersRunning) {
    console.log(chalk.green('✅ Project containers are running'))
  } else {
    console.log(chalk.yellow('⚠️  Project containers are not running'))
    console.log(chalk.yellow('\n💡 Start your project containers:'))
    console.log(chalk.white('   docker-compose up -d'))
  }
  
  // Show Docker info
  try {
    const infoResult = await execa('docker', ['info', '--format', 'json'])
    const info = JSON.parse(infoResult.stdout)
    
    console.log(chalk.blue('\n📊 Docker Information:'))
    console.log(chalk.gray(`   Containers: ${info.Containers || 0} (${info.ContainersRunning || 0} running)`))
    console.log(chalk.gray(`   Images: ${info.Images || 0}`))
    console.log(chalk.gray(`   Server Version: ${info.ServerVersion || 'Unknown'}`))
    
    if (info.MemTotal) {
      console.log(chalk.gray(`   Memory: ${Math.round(info.MemTotal / 1024 / 1024 / 1024 * 100) / 100} GB`))
    }
  } catch {
    console.log(chalk.gray('   (Extended info unavailable)'))
  }
  
  console.log(chalk.green('\n🎉 Docker is ready for Supabase!'))
  console.log(chalk.gray('   Next: npm run pixell supabase-init'))
}

function showManualInstallInstructions(): void {
  const platform = os.platform()
  
  console.log(chalk.blue('\n📋 Manual Docker Installation:'))
  
  if (platform === 'darwin') {
    console.log(chalk.white('macOS:'))
    console.log(chalk.gray('   • Download: https://desktop.docker.com/mac/main/arm64/Docker.dmg (Apple Silicon)'))
    console.log(chalk.gray('   • Download: https://desktop.docker.com/mac/main/amd64/Docker.dmg (Intel)'))
    console.log(chalk.gray('   • Or: brew install --cask docker'))
  } else if (platform === 'win32') {
    console.log(chalk.white('Windows:'))
    console.log(chalk.gray('   • Download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'))
    console.log(chalk.gray('   • Or: choco install docker-desktop'))
    console.log(chalk.gray('   • Or: scoop install docker'))
  } else {
    console.log(chalk.white('Linux:'))
    console.log(chalk.gray('   • curl -fsSL https://get.docker.com -o get-docker.sh'))
    console.log(chalk.gray('   • sudo sh get-docker.sh'))
    console.log(chalk.gray('   • sudo systemctl start docker'))
    console.log(chalk.gray('   • sudo systemctl enable docker'))
  }
  
  console.log(chalk.blue('\n🔗 More info: https://docs.docker.com/get-docker/'))
}

export async function ensureDockerForSupabase(): Promise<void> {
  console.log(chalk.blue('🐳 Checking Docker for Supabase...'))
  
  if (!(await checkDockerInstallation())) {
    console.log(chalk.yellow('⚠️  Docker is required for Supabase local development'))
    
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'install',
        message: 'Install Docker automatically?',
        default: true
      }
    ])
    
    if (answers.install) {
      await installDocker()
    } else {
      showManualInstallInstructions()
      throw new Error('Docker is required for Supabase. Please install Docker and try again.')
    }
  }
  
  if (!(await checkDockerEngineRunning())) {
    console.log(chalk.yellow('⚠️  Docker is installed but not running'))
    
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'start',
        message: 'Start Docker automatically?',
        default: true
      }
    ])
    
    if (answers.start) {
      await startDocker()
      
      // Wait a moment and check again
      console.log(chalk.gray('Waiting for Docker to start...'))
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      if (!(await checkDockerEngineRunning())) {
        throw new Error('Docker is starting but not ready yet. Please wait a moment and try again.')
      }
    } else {
      throw new Error('Docker is not running. Please start Docker and try again.')
    }
  }
  
  // Check if project containers are running
  if (!(await checkDockerContainersRunning())) {
    console.log(chalk.yellow('⚠️  Docker is running but project containers are not started'))
    console.log(chalk.yellow('\n💡 Start your project containers:'))
    console.log(chalk.white('   docker-compose up -d'))
  }
  
  console.log(chalk.green('✅ Docker is ready!'))
} 