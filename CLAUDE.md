@AGENTS.md
### Standard Workflow
1. Before planning, restate the request back to me in one line so we agree on intent.
2. Think through the problem, read the codebase for relevant files, and write a plan to todo.md. Append to todo.md under a new dated heading (`## YYYY-MM-DD — <task>`) so it stays a running log rather than growing into noise.
3. The plan should have a list of todo items that you can check off as you complete them.
4. Before you begin working, check in with me and I will verify the plan.
5. Then, begin working on the todo items, marking them as complete as you go.
6. Plan every step of the way — give me a high level explanation of what changes you made.
7. Make every task and code change as simple as possible. Avoid massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
8. Before the review section, verify:
   - `dart analyze` passes (and `custom_lint` / `riverpod_lint` are clean).
   - `flutter test` passes, including goldens in `test/goldens/`.
   - If any Riverpod providers/annotations changed, run `dart run build_runner build --delete-conflicting-outputs`.
   - For visual changes, run the app (`flutter run`) and confirm the change visually — passing tests ≠ feature works.
9. Finally, add a review section to todo.md with a summary of the changes you made and any other relevant information.

### Code Quality Requirements
- Write comprehensive error handling
- Include unit tests for new functionality (min 80% coverage)

### Git Workflow
1. Never work on `main`. Cut a branch first.
2. Branch naming: `feat/screen-<name>` for a single screen (e.g. `feat/screen-home`); `feat/<scope>` for non-screen features; `fix/<scope>`, `refactor/<scope>`, `chore/<scope>`, `docs/<scope>` for other intents.
3. One concern per branch. Don't bundle a screen, a fix, and a refactor in the same PR.
4. Commits are small and atomic. Sentence-style imperative summary (~70 chars); body explains *why* when non-obvious. Each commit should leave the repo buildable.
5. Push branches early (`git push -u origin <branch>` on the first push) so work is backed up.
6. Before opening or updating a PR, rebase on the latest `main`: `git fetch && git rebase origin/main`. Keep history linear — don't merge `main` into the branch.
7. Merge into `main` via squash PR. Don't push directly to `main`. Don't force-push a branch under review, and don't amend commits that have already been pushed.
8. Delete the branch (local + remote) after the PR merges.

### Rules
1. This project should be made as efficiently as possible. Every line of code should be useful and there should be no dead code.
2. Error logging is extremely important. We want to verify all features are working as expected. Log all errors to error_log.md using this format:
   ```
   ## <page or feature>
   - [YYYY-MM-DD HH:mm] <message> (file:line)
   ```
3. State management is Riverpod-only. No `setState` outside throwaway local UI state. No `Provider` / `Bloc` / `ChangeNotifier`.
4. Do not add new dependencies to `pubspec.yaml` without approval.
5. Lints must pass: `flutter analyze` and `custom_lint` (no warnings, no errors).
6. Never hand-edit generated files (`*.g.dart`, `*.freezed.dart`, etc.) — re-run the generator instead.
7. Dart naming: files `snake_case.dart`, classes `UpperCamelCase`, members `lowerCamelCase`.
8. Never commit directly to `main`. All work goes through a feature branch and a PR (see Git Workflow).