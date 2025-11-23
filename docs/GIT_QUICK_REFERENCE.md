# Git Workflow Quick Reference

## 🚀 Daily Commands (Copy-Paste Ready)

### Morning Routine
```bash
git checkout camera
git pull origin camera
git checkout camera/your-feature
git rebase camera
git push --force-with-lease origin camera/your-feature
```

### During Development
```bash
git add .
git commit -m "feat(camera): your commit message"
git push origin camera/your-feature
```

### Before Merging to Camera
```bash
git checkout camera
git pull origin camera
git checkout camera/your-feature
git rebase camera
npm test  # Run tests
git push --force-with-lease origin camera/your-feature
# Then create PR or merge directly
```

## 📋 Branch Naming

- Feature: `camera/save-video`
- Feature: `camera/ui`
- Feature: `camera/recording`

## 🔄 Merge Commands

### Feature → Camera (Direct Merge)
```bash
git checkout camera
git pull origin camera
git merge camera/your-feature --no-ff -m "feat(camera): your feature"
git push origin camera
git branch -d camera/your-feature
git push origin --delete camera/your-feature
```

## ⚠️ Conflict Resolution

```bash
# During rebase, if conflicts:
git rebase --continue  # After resolving conflicts
git rebase --abort     # To cancel rebase
```

## 📝 Commit Message Format

```
feat(camera): add save video button
fix(camera): resolve permission issue
refactor(camera): simplify code
```

**See full workflow**: `docs/GIT_WORKFLOW_CAMERA.md`

