# 3 - Managing a branch protection rule
In this lab you will create a branch protection rule to enforce certain workflows for one or more branches
> Duration: 5-10 minutes

References:
- [Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule)
- [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

## 3.1 Add a branch protection rule

1. Navigate to the `Settings > Branches` settings of your own repository
2. In the section `Branch protection rules` click on `Add rule`
3. Type `main*` (`master*`) for branch name pattern
4. Check at least the following settings:
    - Require a pull request before merging
    - Require review from Code Owners
    - Require status checks to pass before merging
    - Search for `build`and select it as a required status check
    - Require conversation resolution before merging
    - Include administrators
5. Click `Create` to create the branch protection rule
6. Test the branch protection by adding/updating one file from your repository
7. Commit the changes into a new `feature/lab03` branch 
8. Open a new pull request from `Pull requests`
9. Ask the code owner to review and approve your PR
10. _(Optional)_ Update the CODEOWNERS file to add more members or a team as code reviewers