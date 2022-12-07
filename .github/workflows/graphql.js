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

module.exports = async (ref, { context, github }) => {
  // 誤って ref で取得しようとしてみる
  {
    const res = await github.graphql(query, { owner: context.github.owner, repo: context.github.repo, expression: context.github.ref })
    console.dir(JSON.stringify(res, null, "\t"))
  }

  // commit ref をちゃんと指定したもの
  {
    const res = await github.graphql(query, { owner: context.github.owner, repo: context.github.repo, expression: ref })
    console.dir(JSON.stringify(res, null, "\t"))
  }

  return
}
