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

const statusFromCheckRollupContextConnection = (c) => {
  switch (c.__typename) {
    case "CheckRun": {
      if (c.status !== "COMPLETED") {
        return "PENDING"
      }
      switch (c.conclusion) {
        case "SUCCESS": {
          return "SUCCESS"
        }
        case "SKIPPED": {
          console.log(`ignore skipped run: ${c.permalink}`)
          return "IGNORE"
        }
        case "NEUTRAL": {
          console.log(`ignore neutral run: ${c.permalink}`)
          return "IGNORE"
        }
        default: {
          return "FAILURE"
        }
      }
    }
    case "StatusContext": {
      switch (c.state) {
        case "SUCCESS": {
          return "SUCCESS"
        }
        case "PENDING": {
          return "PENDING"
        }
        case "EXPECTED": {
          console.log(`TODO: unknown state "EXPECTED" given: ${c}`)
        }
        default: {
          return "FAILURE"
        }
      }
    }
    default: {
      throw new Error("unexpected type")
    }
  }
}

module.exports = async ({ context, github }) => {
  // get with sha
  const res = await github.graphql(query, { ...context.repo, expression: context.sha })
  console.log(JSON.stringify(res, null, "\t"))

  if (!res.repository.object) throw new Error("object is null")
  if (res.repository.object.__typename !== "Commit") throw new Error("Object is not commit: " + res.repository.object.__typename)

  const { statusCheckRollup: { contexts: { nodes: contexts } }} = res.repository.object
  const filteredContext = contexts.filter(c => {
    if (c.__typename === "CheckRun" && c.permalink.includes(context.runId.toString(10))) {
      console.log("exclude self context")
      console.dir(c)
      return false
    }
    return true
  })

  let isPending = false
  let isFailure = false
  filteredContext.forEach(c => {
    const st = statusFromCheckRollupContextConnection(c)
    switch (st) {
      case "IGNORE":
        break
      case "FAILURE":
        isFailure = true
        return
      case "PENDING":
        isPending = true
      case "SUCCESS":
        break
    }
  })
  let conclusion = "SUCCESS"
  if (isPending) {
    conclusion = "PENDING"
  }
  if (isFailure) {
    conclusion = "FAILURE"
  }

  console.log(`conclusion = ${conclusion}`)

  return
}
