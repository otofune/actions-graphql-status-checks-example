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

module.exports = async (_, { context, github }) => {
  // 誤って ref で取得しようとしてみる
  {
    const res = await github.graphql(query, { ...context.repo, expression: context.ref })
    console.dir(JSON.stringify(res, null, "\t"))
  }

  // commit ref をちゃんと指定したもの
  {
    const res = await github.graphql(query, { ...context.repo, expression: context.sha })
    console.dir(JSON.stringify(res, null, "\t"))
  }

  return
}
