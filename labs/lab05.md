# 5 - GitHub API - REST API & GraphQL API
In this lab you will create a workflow that calls GitHub APIs using REST API and GraphQL API.
> Duration: 15-20 minutes

References:
- [GitHub GraphQL API - GitHub Docs](https://docs.github.com/en/graphql)
- [GitHub REST API - GitHub Docs](https://docs.github.com/en/rest)
- [Migrating from REST to GraphQL - GitHub Docs](https://docs.github.com/en/graphql/guides/migrating-from-rest-to-graphql)
- [actions/github-script](https://github.com/actions/github-script)
- [octokit/graphql-action](https://github.com/octokit/graphql-action)
- [See octokit/rest.js for the API client documentation](https://octokit.github.io/rest.js/v18)

## 5.1 Develop a GitHub Action workflow that calls REST APIs

1. Open the workflow file [use-github-apis.yml](/.github/workflows/use-github-apis.yml)
2. Edit the file and copy the following YAML content at the end of the `rest-api-create-and-close-issue` job:
```YAML
      - uses: actions/github-script@v6
        id: close-issue
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            const result = await github.rest.issues.update({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{fromJSON(steps.create-issue.outputs.result).number}},
              state: 'closed'
            })            
            console.log(result)
```
3. Commit the changes into the `main` branch
4. Go to `Actions` and see the details of your running workflow

## 5.2 Develop a GitHub Action workflow that calls GraphQL APIs

1. Open the workflow file [use-github-apis.yml](/.github/workflows/use-github-apis.yml)
2. Edit the file and copy the following YAML content at the end of the file:
```YAML
  graphql-api-query-labels:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        id: labels-result
        with:
          script: |
            const query = `query($owner:String!, $name:String!) {
              repository(owner:$owner, name:$name){
                labels (last:100) {
                  nodes {
                    name,
                    color,
                    issues(last:100) {
                      nodes {
                        number
                      }
                    }
                  }
                }
              }
            }`;
            const variables = {
              owner: context.repo.owner,
              name: context.repo.repo
            }
            const result = await github.graphql(query, variables)
            console.log(result.repository.labels.nodes)
```
3. Commit the changes into the `main` branch
4. Go to `Actions` and see the details of your running workflow
