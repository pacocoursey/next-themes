import { test} from '@playwright/test'

test.describe('storage-events test-suite', async () => {
  test('should switch theme if storage theme value is updated', async () => {
    // TODO
  })

  test('should ignore storage event if on page with forced-theme', async () => {
    // TODO: perhaps also check if the updated value is applied
    //  once moving to a page with non forced-theme
  })
})