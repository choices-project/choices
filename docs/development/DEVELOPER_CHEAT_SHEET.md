# 🚀 Developer Cheat Sheet
*Created: September 9, 2025*  
*Last Updated: 2025-09-09*

## 🔍 Fast Error Detection Commands

### TypeScript & Build Errors
```bash
# Fastest way to get ALL TypeScript errors (no build artifacts)
npx tsc --noEmit

# Next.js specific type checking
npx next build --dry-run

# ESLint only (catches unused vars, style issues, etc.)
npx eslint . --ext .ts,.tsx

# Combined check (TypeScript + ESLint)
npx tsc --noEmit && npx eslint . --ext .ts,.tsx

# Full build (slowest but most comprehensive)
npm run build
```

### Package & Dependency Management
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check outdated packages
npm outdated

# Clean install (delete node_modules and reinstall)
rm -rf node_modules package-lock.json && npm install

# Check package integrity
npm ls --depth=0
```

## 🐙 Git Power Commands

### Essential Git Commands
```bash
# See what's changed (staged vs unstaged)
git status
git diff                    # unstaged changes
git diff --staged          # staged changes
git diff HEAD~1            # changes in last commit

# Staging & Committing
git add .                  # stage all changes
git add -p                 # interactive staging (choose hunks)
git commit -m "message"    # commit with message
git commit --amend         # fix last commit message

# Branching
git branch                 # list branches
git branch -a              # list all branches (including remote)
git checkout -b new-branch # create and switch to new branch
git switch -c new-branch   # modern way to create and switch
git branch -d branch-name  # delete local branch
git push origin --delete branch-name  # delete remote branch

# Merging & Rebasing
git merge branch-name      # merge branch into current
git rebase main            # rebase current branch onto main
git rebase -i HEAD~3       # interactive rebase last 3 commits

# Undoing Things
git reset HEAD~1           # undo last commit (keep changes)
git reset --hard HEAD~1    # undo last commit (discard changes)
git revert HEAD            # create new commit that undoes last commit
git checkout -- file.txt   # discard changes to specific file
git clean -fd              # remove untracked files and directories

# Remote Operations
git fetch                  # download changes from remote
git pull                   # fetch + merge
git push                   # push to remote
git push -u origin branch  # push and set upstream
git remote -v              # show remote URLs
```

### Advanced Git Commands
```bash
# Logging & History
git log --oneline          # compact log
git log --graph --oneline  # visual log with graph
git log -p                 # log with diffs
git log --since="2 weeks ago"
git log --author="name"
git log --grep="search term"

# Stashing
git stash                  # stash current changes
git stash list             # list stashes
git stash pop              # apply and remove most recent stash
git stash apply            # apply stash but keep it
git stash drop             # delete most recent stash

# Bisecting (find when bug was introduced)
git bisect start
git bisect bad             # mark current commit as bad
git bisect good HEAD~10    # mark commit 10 back as good
# test the code, then:
git bisect good            # if this commit is good
git bisect bad             # if this commit is bad
git bisect reset           # when done

# Cherry-picking
git cherry-pick commit-hash # apply specific commit to current branch

# Reflog (recovery)
git reflog                 # see all recent HEAD movements
git checkout HEAD@{2}      # go back to HEAD position from reflog
```

## 🖥️ Terminal & Shell Commands

### File Operations
```bash
# Navigation
cd -                      # go back to previous directory
pushd /path               # push directory onto stack
popd                      # pop directory from stack
dirs                      # show directory stack

# File Operations
ls -la                    # detailed file listing
ls -lt                    # sort by modification time
ls -lS                    # sort by size
find . -name "*.ts"       # find files by name
find . -type f -name "*.ts" -exec grep -l "pattern" {} \;  # find files containing pattern

# File Content
head -n 20 file.txt       # first 20 lines
tail -n 20 file.txt       # last 20 lines
tail -f file.txt          # follow file changes (great for logs)
grep -r "pattern" .       # search recursively
grep -n "pattern" file.txt # search with line numbers
grep -i "pattern" file.txt # case insensitive search

# Process Management
ps aux                    # list all processes
ps aux | grep node        # find node processes
kill -9 PID               # force kill process
jobs                      # list background jobs
fg                        # bring job to foreground
bg                        # send job to background
```

### System Information
```bash
# System Info
uname -a                  # system information
df -h                     # disk usage
du -sh *                  # directory sizes
free -h                   # memory usage
top                       # running processes
htop                      # better process viewer (if installed)

# Network
netstat -tulpn            # network connections
lsof -i :3000             # what's using port 3000
curl -I https://example.com # get headers only
wget -O file.txt url      # download file
```

## 📦 Package Management

### npm Commands
```bash
# Installation
npm install               # install dependencies
npm install package       # install package
npm install -g package    # install globally
npm install --save-dev package  # install as dev dependency
npm install --save-exact package  # install exact version

# Scripts & Running
npm run script-name       # run script
npm start                 # run start script
npm test                  # run test script
npm run build             # run build script

# Package Info
npm list                  # list installed packages
npm list -g               # list global packages
npm outdated              # check for outdated packages
npm audit                 # security audit
npm info package          # package information
npm view package versions # see all versions

# Cleanup
npm cache clean --force   # clear npm cache
npm prune                 # remove unused packages
```

### Yarn Commands (if using Yarn)
```bash
yarn install              # install dependencies
yarn add package          # add package
yarn add -D package       # add dev dependency
yarn remove package       # remove package
yarn upgrade              # upgrade packages
yarn outdated             # check outdated
yarn audit                # security audit
```

## 🔧 Development Tools

### VS Code Shortcuts
```bash
# Essential Shortcuts
Ctrl+Shift+P              # Command Palette
Ctrl+P                    # Quick Open
Ctrl+Shift+`              # Open Terminal
Ctrl+`                    # Toggle Terminal
Ctrl+B                    # Toggle Sidebar
Ctrl+Shift+E              # Explorer
Ctrl+Shift+F              # Search
Ctrl+Shift+G              # Source Control
Ctrl+Shift+X              # Extensions
Ctrl+,                    # Settings
Ctrl+K Ctrl+S             # Keyboard Shortcuts

# Editing
Ctrl+D                    # Select next occurrence
Ctrl+Shift+L              # Select all occurrences
Alt+Click                 # Multi-cursor
Ctrl+Shift+K              # Delete line
Alt+Up/Down               # Move line up/down
Shift+Alt+Up/Down         # Copy line up/down
Ctrl+/                    # Toggle comment
Shift+Alt+A               # Toggle block comment
Ctrl+Shift+\              # Go to matching bracket
```

### Useful VS Code Extensions
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**
- **Prettier**
- **ESLint**
- **Thunder Client** (API testing)
- **REST Client**

## 🐳 Docker Commands (if using)

```bash
# Basic Operations
docker build -t image-name .     # build image
docker run -p 3000:3000 image-name  # run container
docker ps                       # list running containers
docker ps -a                    # list all containers
docker images                   # list images
docker logs container-id        # view logs

# Cleanup
docker system prune             # remove unused data
docker container prune          # remove stopped containers
docker image prune              # remove unused images
```

## 🔍 Debugging Commands

### Node.js Debugging
```bash
# Run with debugging
node --inspect app.js
node --inspect-brk app.js       # break on first line

# Memory debugging
node --inspect --max-old-space-size=4096 app.js
```

### Network Debugging
```bash
# Test API endpoints
curl -X GET https://api.example.com/users
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' https://api.example.com/users

# Check if port is open
telnet localhost 3000
nc -zv localhost 3000
```

## 📊 Performance & Monitoring

### Performance Commands
```bash
# Bundle analysis (for web apps)
npx webpack-bundle-analyzer dist/static/js/*.js
npx source-map-explorer 'build/static/js/*.js'

# Memory usage
node --max-old-space-size=4096 app.js
```

### Log Analysis
```bash
# Common log analysis
grep "ERROR" app.log | tail -20
grep "ERROR" app.log | wc -l     # count errors
awk '{print $1}' app.log | sort | uniq -c  # count by date
```

## 🚀 Deployment Commands

### Common Deployment
```bash
# Build for production
npm run build
npm run build:prod

# Environment variables
export NODE_ENV=production
export PORT=3000

# PM2 (Process Manager)
pm2 start app.js
pm2 list
pm2 restart app
pm2 stop app
pm2 logs app
```

## 💡 Pro Tips

### Terminal Productivity
```bash
# Create aliases in ~/.bashrc or ~/.zshrc
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias f='find . -name'

# Use history effectively
history | grep "command"        # search command history
!!                              # repeat last command
!$                              # last argument of previous command
!^                              # first argument of previous command
```

### Git Aliases (add to ~/.gitconfig)
```bash
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
    lg = log --oneline --graph --decorate --all
```

### Environment Setup
```bash
# Create .env files
touch .env.local
touch .env.development
touch .env.production

# Use direnv for automatic env loading
echo "export NODE_ENV=development" > .envrc
direnv allow
```

---

## 🎯 Quick Reference

### Most Used Commands
1. `npx tsc --noEmit` - Fast TypeScript error check
2. `git status` - See what's changed
3. `git add -p` - Interactive staging
4. `git log --oneline` - Compact commit history
5. `npm run build` - Build project
6. `tail -f logs/app.log` - Follow log file
7. `ps aux | grep node` - Find node processes
8. `lsof -i :3000` - What's using port 3000

### Emergency Commands
- `git reflog` - Recover lost commits
- `git stash` - Temporarily save changes
- `git reset --hard HEAD` - Discard all changes
- `npm cache clean --force` - Clear npm cache
- `rm -rf node_modules && npm install` - Nuclear option for dependencies

*Updated: December 19, 2024*
