# 4 - GitHub Templates
In this lab you will create issue and pull request templates and make an existing repository a template.
> Duration: 5-10 minutes

References:
- [Issue & pull request templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)
- [Configuring issue templates for your repository](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
- [Creating a pull request template for your repository](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)
- [Creating a template repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
- [Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)

## 4.1 Create issue templates

1. Navigate to the `Settings > General` page of your repository
2. In the `Features > Issues` section, click `Set up templates` button
3. Select a template from the list
4. Review the template by clicking on `Preview and edit`
5. Edit the issue if needed to add your changes
6. Click on `Propose changes` to commit the tempaltes to your repository. 
7. Repeat steps 3) to 6) to add more issue templates

## 4.2 Create pull request templates

1. Navigate to the `main` branch of your repository
2. Click `Add file` to create a new file
3. Name the file `.github/pull_request_template.md`
4. In the body of the file, add your template:
5. `Propose new file` and commit it directly to the `main` branch
```markdown
Fixes #

### Changes proposed with this pull request:
-  
- 
- 

### Checklist
- [ ] Check the commit's or even all commits' message styles matches our requested structure.
- [ ] Check your code additions will fail neither code linting checks nor unit test.

```

## 4.3 Create a template repository _(Optional)_

1. Navigate to the `Settings > General` page of your repository
2. Select `Template repository` checkbox
3. Navigate to your repository list and click `New repository`
4. The `repository template` list should contain your new repository template
5. _(Optional)_ Create a new repository from one of the templates
6. _(Optional)_ Navigate to your repository template and click on the `Use this template` button

## 4.4 Create a Pull Request _(Optional)_

1. Navigate to the `main` branch of your repository
2. Update the [README.md](/README.md) file with checking the completed activities [x]
3. Commit the changes into a new `feature/lab04` branch 
4. Open a new pull request from `Pull requests`
5. The template you created will be displayed and used when creating a new PR