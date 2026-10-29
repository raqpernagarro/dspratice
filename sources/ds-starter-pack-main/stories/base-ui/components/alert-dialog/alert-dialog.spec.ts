import type { ComponentSpec } from '../../spec/types'
import { dialogBindings, dialogParts, dialogProps } from '../dialog/dialog.spec'

/** Dialog’s look, with its own tokens: confirmations can be styled apart from task dialogs. */
export const alertDialogSpec: ComponentSpec = {
  name: 'Alert Dialog',
  slug: 'alert-dialog',
  axes: [],
  parts: dialogParts('AlertDialog'),
  bindings: dialogBindings('alert-dialog'),
  // No close button by default: an alert dialog is answered with its actions.
  figmaProps: dialogProps('Discard draft?', 'You can’t undo this action.', 'AlertDialog', false),
  docs: {
    summary: 'A dialog that asks the user to confirm or cancel an important action. It can’t be dismissed by clicking outside.',
    baseUi: 'https://base-ui.com/react/components/alert-dialog',
    usage: [
      'Ask a question as the title (“Discard draft?”) and say what happens in the description.',
      'Label the buttons with the outcome (“Discard”, “Cancel”), not “Yes” / “No”; make a destructive action the destructive Button.',
    ],
    dont: ['Don’t use it for routine confirmations; prefer undo.', 'Don’t use it for forms; use Dialog.'],
    accessibility: [
      'Renders role="alertdialog"; focus is trapped inside until the user picks an action or presses Escape.',
      'Clicking the backdrop doesn’t close it.',
    ],
  },
}
