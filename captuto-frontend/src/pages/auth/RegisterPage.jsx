import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      const res = await authService.register({
        name: data.name,
        email: data.email,
        company_name: data.company_name,
        password: data.password,
        password_confirmation: data.confirm_password,
      });
      const { user, token } = res.data.data;
      login(user, token);
      navigate('/');
      toast.success('Account created!');
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat()[0]
        : err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center gap-1 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#534AB7] rounded-xl flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <span className="text-xl font-medium text-[#534AB7]">Capturo</span>
          </div>
          <p className="text-xs text-gray-400">Scan, Extract, Beres</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="font-medium text-gray-900 text-lg mb-1">Create account</h2>
          <p className="text-sm text-gray-400 mb-6">Join Capturo and automate your data entry</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="Your full name"
              error={errors.name?.message}
              {...register('name', { required: 'Full name is required' })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Company Name"
              placeholder="Your company (optional)"
              {...register('company_name')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              error={errors.confirm_password?.message}
              {...register('confirm_password', {
                required: 'Please confirm your password',
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#534AB7] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
