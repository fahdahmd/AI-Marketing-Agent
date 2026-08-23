# GITHUB REPOSITORY & COMMIT HISTORY

The target GitHub repository for this project is:

```text
https://github.com/Fahad28may/AI-Marketing-Agent.git
```

This repository is specifically intended for the AI Marketing Agent SaaS being built in this project.

## Git initialization

If Git is not initialized:

```bash
git init
```

Configure the repository:

```bash
git remote add origin https://github.com/Fahad28may/AI-Marketing-Agent.git
git branch -M main
```

If `origin` already exists, DO NOT add it again.

Instead inspect it:

```bash
git remote -v
```

If the existing origin is incorrect, update it:

```bash
git remote set-url origin https://github.com/Fahad28may/AI-Marketing-Agent.git
```

---

# COMMIT HISTORY REQUIREMENT

Do NOT wait until the entire application is finished before committing.

Build the project incrementally and create meaningful Git commits throughout development.

Each significant completed feature should have its own commit.

Examples:

```text
chore: initialize Next.js SaaS project
chore: configure database and Prisma
feat: add authentication
feat: add workspace architecture
feat: add brand onboarding
feat: add product management
feat: add campaign builder
feat: add AI provider abstraction
feat: add AI campaign generation
feat: add social content generation
feat: add content review workflow
feat: add social provider abstraction
feat: add mock social publishing
feat: add content calendar
feat: add analytics dashboard
feat: add recommendation engine
feat: add SEO module
feat: add AI usage tracking
feat: add credit system
feat: add Paddle billing
feat: add Paddle webhook handling
feat: add subscription entitlements
feat: add billing UI
feat: add notifications
feat: add audit logging
test: add campaign workflow tests
test: add billing and entitlement tests
fix: resolve authentication issues
fix: resolve publishing workflow
refactor: improve AI service architecture
docs: add setup documentation
```

Use conventional commit style:

```text
feat:
fix:
refactor:
test:
docs:
chore:
```

Do not create meaningless commits such as:

```text
update
changes
stuff
final
test
asdf
```

---

# PUSH TO GITHUB

After completing a meaningful feature:

1. Check the changes:

```bash
git status
```

2. Review the diff:

```bash
git diff
```

3. Stage the appropriate files:

```bash
git add .
```

4. Create a meaningful commit:

```bash
git commit -m "feat: add campaign builder"
```

5. Push to GitHub:

```bash
git push origin main
```

Do this throughout development.

---

# IMPORTANT: VERIFY BEFORE COMMITTING

Before each meaningful commit:

- Ensure the application still builds.
- Ensure there are no accidental secrets.
- Ensure `.env` is ignored.
- Ensure generated/build files are ignored.
- Ensure the commit contains only relevant changes.

Never commit:

```text
.env
.env.local
API keys
OAuth secrets
Paddle API keys
Paddle webhook secrets
Database passwords
Private credentials
node_modules
Build artifacts
```

Make sure `.gitignore` contains appropriate entries.

---

# INITIAL PUSH

After the initial project structure is working:

```bash
git add .
git commit -m "chore: initialize AI Marketing Agent SaaS"
git push -u origin main
```

Then continue development using incremental commits.

---

# CONTINUOUS GITHUB WORKFLOW

Follow this cycle throughout development:

```text
Implement feature
      ↓
Run tests
      ↓
Run lint
      ↓
Run build
      ↓
Inspect git diff
      ↓
Commit feature
      ↓
Push to GitHub
      ↓
Continue to next feature
```

Do NOT accumulate the entire project locally and push everything at the end.

The GitHub repository should show a meaningful development history demonstrating how the product was built.

---

# IF A PUSH FAILS

If:

```bash
git push
```

fails:

1. Inspect the error.
2. Determine the cause.
3. Fix the issue if it is safe to do so.
4. Retry the push.

Do not delete commits or force-push unless absolutely necessary.

Never use:

```bash
git push --force
```

on the main branch unless explicitly instructed by the user.

If the remote contains commits that are not present locally, inspect the situation before deciding whether to pull/rebase/merge.

Do not overwrite remote work blindly.

---

# FINAL GITHUB VERIFICATION

At the end of development, verify:

```bash
git status
git log --oneline --decorate --graph -20
git remote -v
git branch
```

Ensure:

- Current branch is `main`
- Remote is the AI-Marketing-Agent repository
- Working tree is clean or any remaining changes are explicitly explained
- Commits exist for the major features
- Latest commits have been pushed successfully

The final response should include:

```text
GitHub repository:
https://github.com/Fahad28may/AI-Marketing-Agent.git

Branch:
main

Commit history:
[summary of major commits]

Push status:
Successfully pushed / explain any issue
```

The GitHub repository should contain the complete working project and a meaningful chronological commit history.