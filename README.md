# Workflow Event javascript action

Correctly parse data on worklow events

## Inputs

### `github-token`

**Required** GitHub token. (e.g. `secrets.GITHUB_TOKEN`).

## Outputs

### `ref`

Event reference

### `sha`

Event sha

### `commit`

Event head commit

## Example usage

```
uses: coingate/workflow-event-action@master
with:
  github-token: '${{ secrets.GITHUB_TOKEN }}'
```