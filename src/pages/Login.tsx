import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import yachtcountLogo from '@/assets/yachtcount-logo.png';
import loginBg from '@/assets/login-bg.jpg';

interface LoginProps {
  onLogin: (username: string, password: string, keepLoggedIn: boolean) => Promise<{ error: string | null }>;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await onLogin(username, password, keepLoggedIn);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />

      <Card className="w-full max-w-sm relative z-10 border-border/30 bg-card/90 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg"
              style={{ backgroundColor: '#192740' }}
            >
              <img src={yachtcountLogo} alt="YachtCount Logo" className="w-full h-full object-contain p-3" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">YachtCount</CardTitle>
            <p className="text-sm text-muted-foreground italic mt-1">
              Professional Inventory Systems for Maritime Excellence.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Full name / username</Label>
              <Input
                id="username"
                autoCapitalize="none"
                autoComplete="username"
                type="text"
                placeholder="e.g. George Atkinson"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Vessel password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter vessel password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keepLoggedIn"
                checked={keepLoggedIn}
                onCheckedChange={(checked) => setKeepLoggedIn(checked === true)}
              />
              <Label htmlFor="keepLoggedIn" className="text-sm font-normal cursor-pointer">
                Keep me logged in
              </Label>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
