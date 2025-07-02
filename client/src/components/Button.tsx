import { ClipLoader } from 'react-spinners';

interface ButtonProps {
  additionalClasses?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  style?: 'contained' | 'outlined' | 'text';
}

const Button = ({
  additionalClasses,
  children,
  disabled = false,
  loading = false,
  onClick,
  style = 'contained',
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={`${
        style === 'contained' &&
        'bg-primary text-white hover:bg-primary-dark disabled:bg-gray-500 disabled:text-gray-700'
      } ${
        style === 'outlined' &&
        'border border-primary text-primary hover:bg-primary/10 disabled:border-gray-200 disabled:text-gray-200'
      } ${
        style === 'text' &&
        'text-primary hover:bg-gray-100 disabled:text-gray-200'
      } flex items-center justify-center gap-4 px-4 py-2 rounded transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${additionalClasses}`}
    >
      {loading && <ClipLoader size={16} color="white" />}
      {children}
    </button>
  );
};

export default Button;
