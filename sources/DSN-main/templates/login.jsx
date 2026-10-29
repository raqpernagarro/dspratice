import { AppShell, Card, Form, TextInput, PasswordInput, Checkbox, Button, Separator, Avatar } from 'ds-ngr';
import { Mail, KeyRound } from 'lucide-react';

export default function SignInPage() {
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell>
        <div
          style={{
            maxWidth: 'var(--size-container-md)',
            marginInline: 'auto',
            width: '100%',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 'var(--space-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-foreground-neutral-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
            <Avatar size="sm" variant="organization" fill="initials" initials="NG" name="Nagarro" />
            <span>WorkScope</span>
          </div>

          <Card
            title="Sign in"
            description="Welcome back. Use your work email to continue."
            headerSize="medium"
            showBottomBar={false}
          >
            <Form>
              <TextInput label="Work email" placeholder="name@company.com" autoComplete="email" leadingIcon={<Mail size={16} />} />
              <PasswordInput
                label="Password"
                autoComplete="current-password"
                labelAction={<Button variant="plain" size="sm">Forgot password?</Button>}
              />
              <Checkbox label="Keep me signed in on this device" showTrailingIcon={false} />
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                shortcut
                shortcutLabel="⌘↵"
                shortcutAriaLabel="Command Enter"
              >
                Sign in
              </Button>
            </Form>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Separator />
            <Button
              variant="secondary"
              size="md"
              fullWidth
              showLeadingIcon
              leadingIcon={<KeyRound size={16} />}
            >
              Continue with single sign-on
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2xs)', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-secondary)' }}>
              <span>New to WorkScope?</span>
              <Button variant="plain" size="sm">Request access</Button>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
