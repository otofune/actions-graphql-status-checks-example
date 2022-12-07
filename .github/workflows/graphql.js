// to improve implement paging
const query = `query commitRef($owner: String!, $repo: String!, $expression: String!) {
  repository(name: $repo, owner: $owner) {
    object(expression: $expression) {
      __typename
      ... on Commit {
        statusCheckRollup {
          state
          contexts(first: 100) {
            totalCount
            nodes {
              __typename
              ... on CheckRun {
                completedAt
                conclusion
                permalink
                startedAt
                status
                summary
                text
              }
              ... on StatusContext {
                createdAt
                context
                description
                state
                targetUrl
              }
            }
          }
        }
      }
    }
  }
}
`

module.exports = async ({ context, github }) => {
  // get with ref (will break with tag ref) 
  {
    console.log(context.ref)
    const res = await github.graphql(query, { ...context.repo, expression: context.ref })
    console.log(JSON.stringify(res, null, "\t"))
  }

  // get with sha
  {
    console.log(context.sha)
    const res = await github.graphql(query, { ...context.repo, expression: context.sha })
    console.log(JSON.stringify(res, null, "\t"))
  }

  return
}
