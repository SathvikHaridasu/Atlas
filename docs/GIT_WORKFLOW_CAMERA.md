# Git Workflow: Camera Feature Branch Strategy

## 🎯 Overview

**Base Branch**: `camera` (long-lived feature branch)  
**Feature Branches**: `camera/{feature-name}` (short-lived, merge back to `camera`)  
**Target**: `main` (only when `camera` is production-ready)

**Team Size**: 3 developers  
**Goal**: Parallel development with minimal conflicts

---

## 📊 Workflow Model: **Trunk-Based with Feature Branches**

```
main (production)
  │
  └── camera (feature integration branch)
       │
       ├── camera/save-video (Dev 1)
       ├── camera/ui (Dev 2)
       └── camera/recording (Dev 3)
```

**Why this model?**
- `camera` stays stable and testable
- Feature branches are isolated and short-lived
- Frequent merges back to `camera` catch conflicts early
- No direct merges to `main` until `camera` is complete

---

## 🌿 Branch Structure

### Base Branch
- **`camera`**: Integration branch for all camera work
  - Always in a working state
  - Protected (no force push)
  - All feature branches merge here first

### Feature Branches (Naming Convention)
- **`camera/save-video`**: Video saving to camera roll
- **`camera/ui`**: Camera UI improvements
- **`camera/recording`**: Video recording functionality
- **`camera/{your-feature}`**: Any new camera feature

**Rules:**
- Feature branches MUST start with `camera/`
- Keep branches short-lived (merge within 1-3 days)
- One feature per branch

---

## 👥 Step-by-Step Instructions for Each Developer

### **Initial Setup (One-Time, All Devs)**

```bash
# 1. Fetch latest from remote
git fetch origin

# 2. Checkout camera branch
git checkout camera

# 3. Pull latest changes
git pull origin camera

# 4. Create your feature branch
git checkout -b camera/save-video  # Dev 1
# OR
git checkout -b camera/ui          # Dev 2
# OR
git checkout -b camera/recording   # Dev 3

# 5. Push your branch to remote (set upstream)
git push -u origin camera/save-video
```

---

### **Daily Workflow (Each Developer)**

#### **Morning: Start of Day**

```bash
# 1. Switch to camera branch
git checkout camera

# 2. Pull latest changes (others may have merged)
git pull origin camera

# 3. Switch back to your feature branch
git checkout camera/save-video

# 4. Rebase your branch on top of latest camera
git rebase camera

# 5. If conflicts occur during rebase:
#    - Resolve conflicts in your editor
#    - git add <resolved-files>
#    - git rebase --continue
#    - If stuck: git rebase --abort (then ask for help)

# 6. Force push your rebased branch (safe because it's your feature branch)
git push --force-with-lease origin camera/save-video
```

#### **During Development**

```bash
# Make your changes, then commit frequently
git add .
git commit -m "feat(camera): add save video button component"

# Push your work regularly
git push origin camera/save-video
```

#### **Before Merging to Camera (End of Day or Feature Complete)**

```bash
# 1. Ensure your branch is up to date
git checkout camera
git pull origin camera
git checkout camera/save-video
git rebase camera

# 2. Run tests locally
npm test
# OR your test command

# 3. Ensure your feature works in isolation
# Test your specific feature thoroughly

# 4. Push final changes
git push --force-with-lease origin camera/save-video
```

---

### **Merging Feature → Camera**

#### **Option A: Via Pull Request (Recommended)**

```bash
# 1. Push your final changes
git push origin camera/save-video

# 2. Create PR on GitHub/GitLab:
#    - Base: camera
#    - Compare: camera/save-video
#    - Title: "feat(camera): implement video saving to camera roll"
#    - Description: Brief summary of changes

# 3. Request review from one other dev (optional but recommended)

# 4. After approval, merge PR (use "Squash and Merge" or "Rebase and Merge")
#    - DO NOT use "Merge Commit" (keeps history cleaner)
```

#### **Option B: Direct Merge (If PRs are not required)**

```bash
# 1. Ensure camera is up to date
git checkout camera
git pull origin camera

# 2. Merge your feature branch
git merge camera/save-video --no-ff -m "feat(camera): implement video saving to camera roll"

# 3. Push to camera
git push origin camera

# 4. Delete your feature branch (local and remote)
git branch -d camera/save-video
git push origin --delete camera/save-video
```

---

## 🔀 Merge Strategy

### **Feature → Camera**

**When to merge:**
- ✅ Feature is complete and tested
- ✅ No breaking changes to existing camera functionality
- ✅ Code is reviewed (if using PRs)
- ✅ Conflicts with `camera` are resolved

**How to merge:**
- **Preferred**: Squash merge (keeps `camera` history clean)
- **Alternative**: Rebase merge (linear history)
- **Avoid**: Merge commit (creates unnecessary merge commits)

**Frequency:**
- Merge at least once per day if working on the feature
- Merge immediately when feature is complete
- Don't let feature branches live longer than 3 days

### **Camera → Main**

**When to merge:**
- ✅ All camera features are complete
- ✅ All tests pass
- ✅ Code review completed
- ✅ No known bugs
- ✅ Team approval

**How to merge:**
- Create PR: `camera` → `main`
- Require 2 approvals (or all 3 devs)
- Use **Squash and Merge** or **Rebase and Merge**
- Tag release after merge

---

## 🧪 Testing Protocol

### **Individual Feature Testing**

Each dev should test their feature in isolation:

```bash
# 1. On your feature branch
git checkout camera/save-video

# 2. Run app and test your specific feature
npm start
# Test: Video saving works correctly

# 3. Run unit tests (if applicable)
npm test

# 4. Test edge cases
# - Permission denied scenarios
# - Network errors
# - Large video files
```

### **Integration Testing (Before Merging to Camera)**

```bash
# 1. Merge camera into your feature branch
git checkout camera/save-video
git merge camera

# 2. Resolve any conflicts
# 3. Test that your feature still works with latest camera changes
npm start
# Test: Your feature + other camera features work together

# 4. If tests pass, proceed with merge to camera
```

### **Camera Branch Testing (Before Merging to Main)**

```bash
# 1. Checkout camera
git checkout camera
git pull origin camera

# 2. Run full test suite
npm test

# 3. Manual testing checklist:
#    - [ ] Video recording works
#    - [ ] Video saving works
#    - [ ] Camera UI is functional
#    - [ ] No regressions in existing features
#    - [ ] App builds successfully
#    - [ ] No console errors
```

---

## 🚨 Conflict Avoidance Checklist

### **Before Starting Work**

- [ ] Pull latest `camera` branch
- [ ] Create feature branch from latest `camera`
- [ ] Communicate with team about files you'll modify

### **During Development**

- [ ] Commit frequently (small, logical commits)
- [ ] Pull `camera` daily and rebase your branch
- [ ] Avoid modifying files others are working on
- [ ] If you must modify shared files, coordinate with team

### **Before Merging**

- [ ] Rebase your branch on latest `camera`
- [ ] Resolve all conflicts locally
- [ ] Run tests
- [ ] Ensure your feature works with latest `camera` changes

### **File Ownership (Coordinate with Team)**

| File | Owner | Notes |
|------|-------|-------|
| `src/screens/CameraScreen.tsx` | All | Coordinate changes |
| `src/components/SaveVideoButton.tsx` | Dev 1 | Save video feature |
| `src/hooks/useSaveVideo.ts` | Dev 1 | Save video feature |
| `src/utils/mediaPermissions.ts` | Dev 1 | Save video feature |
| Camera UI components | Dev 2 | UI feature |
| Recording logic | Dev 3 | Recording feature |

**Rule**: If you need to modify a file owned by someone else, discuss first or create a shared branch.

---

## 📋 Complete Command Reference

### **Dev 1: Save Video Feature**

```bash
# Setup
git fetch origin
git checkout camera
git pull origin camera
git checkout -b camera/save-video
git push -u origin camera/save-video

# Daily work
git checkout camera
git pull origin camera
git checkout camera/save-video
git rebase camera
git push --force-with-lease origin camera/save-video

# Make changes, commit
git add .
git commit -m "feat(camera): add save video button"
git push origin camera/save-video

# Merge to camera (via PR or direct)
git checkout camera
git pull origin camera
git merge camera/save-video --no-ff -m "feat(camera): implement video saving"
git push origin camera
git branch -d camera/save-video
git push origin --delete camera/save-video
```

### **Dev 2: UI Feature**

```bash
# Setup
git fetch origin
git checkout camera
git pull origin camera
git checkout -b camera/ui
git push -u origin camera/ui

# Daily work (same pattern as Dev 1)
git checkout camera
git pull origin camera
git checkout camera/ui
git rebase camera
git push --force-with-lease origin camera/ui
```

### **Dev 3: Recording Feature**

```bash
# Setup
git fetch origin
git checkout camera
git pull origin camera
git checkout -b camera/recording
git push -u origin camera/recording

# Daily work (same pattern as Dev 1)
git checkout camera
git pull origin camera
git checkout camera/recording
git rebase camera
git push --force-with-lease origin camera/recording
```

---

## 🎯 Merging Camera → Main (Final Step)

### **When Camera is Complete**

```bash
# 1. Ensure camera is up to date and tested
git checkout camera
git pull origin camera

# 2. Run final tests
npm test
npm run lint

# 3. Create PR: camera → main
#    - Title: "feat: complete camera feature implementation"
#    - Description: List all features included
#    - Require 2 approvals

# 4. After approval, merge PR (Squash and Merge)

# 5. Tag the release
git checkout main
git pull origin main
git tag -a v1.0.0-camera -m "Camera feature complete"
git push origin v1.0.0-camera

# 6. Delete camera branch (optional, after confirming merge)
git branch -d camera
git push origin --delete camera
```

---

## ⚠️ Emergency Procedures

### **If Camera Branch Breaks**

```bash
# 1. Identify the problematic commit
git log --oneline camera

# 2. Revert the commit
git checkout camera
git revert <commit-hash>
git push origin camera

# 3. Notify team
```

### **If Your Feature Branch Has Too Many Conflicts**

```bash
# 1. Save your work
git stash

# 2. Start fresh from latest camera
git checkout camera
git pull origin camera
git checkout -b camera/save-video-v2

# 3. Cherry-pick your commits
git cherry-pick <commit-hash-1>
git cherry-pick <commit-hash-2>
# Resolve conflicts as you go

# 4. Delete old branch
git branch -D camera/save-video
git push origin --delete camera/save-video
```

### **If You Accidentally Committed to Camera**

```bash
# 1. Create a feature branch from your commit
git checkout camera
git checkout -b camera/your-feature
git push -u origin camera/your-feature

# 2. Reset camera to previous commit
git checkout camera
git reset --hard origin/camera
git push --force-with-lease origin camera

# 3. Merge your feature branch properly
```

---

## 📝 Commit Message Convention

Use conventional commits for clarity:

```
feat(camera): add save video button component
fix(camera): resolve permission request on Android
refactor(camera): simplify video recording logic
test(camera): add unit tests for save video hook
docs(camera): update camera feature documentation
```

**Format**: `<type>(scope): <description>`

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`

---

## ✅ Quick Reference Checklist

### **Starting a New Feature**
- [ ] `git checkout camera && git pull origin camera`
- [ ] `git checkout -b camera/your-feature`
- [ ] `git push -u origin camera/your-feature`

### **Daily Work**
- [ ] Rebase on `camera` every morning
- [ ] Commit frequently
- [ ] Push regularly

### **Merging to Camera**
- [ ] Rebase on latest `camera`
- [ ] Run tests
- [ ] Create PR or merge directly
- [ ] Delete feature branch after merge

### **Before Merging Camera → Main**
- [ ] All features complete
- [ ] All tests pass
- [ ] Code reviewed
- [ ] No known bugs
- [ ] Team approval

---

## 🎓 Best Practices Summary

1. **Keep feature branches short-lived** (1-3 days max)
2. **Rebase daily** to catch conflicts early
3. **Communicate** with team about shared files
4. **Test before merging** to keep `camera` stable
5. **Use PRs** when possible for code review
6. **Squash merge** to keep history clean
7. **Delete branches** after merging

---

## 📞 Team Communication

**Before starting work:**
- Announce which files you'll be modifying
- Check if others are working on the same files

**When merging:**
- Notify team in Slack/chat
- Mention any breaking changes
- Share test results

**If conflicts arise:**
- Don't panic
- Communicate with the other dev
- Resolve together if needed

---

**Last Updated**: [Current Date]  
**Maintained By**: Development Team  
**Questions?**: Ask in team chat or create an issue

