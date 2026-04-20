import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await authService.login(data);
      const { user, token } = res.data.data;
      login(user, token);
      navigate('/');
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[380px]">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#534AB7] rounded-xl flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <span className="text-xl font-medium text-[#534AB7]">Captuto</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="font-medium text-gray-900 text-lg mb-1">Sign in</h2>
          <p className="text-sm text-gray-400 mb-6">Welcome back to Captuto</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#534AB7] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
