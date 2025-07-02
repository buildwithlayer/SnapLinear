interface ToolTypeBadgeProps {
  type: 'New' | 'Updated';
}

const ToolTypeBadge = ({ type }: ToolTypeBadgeProps) => {
  return (
    <div
      className={`px-2 py-0.5 rounded-md border w-fit h-fit ${
        type === 'New' && 'border-green-600 text-green-600'
      } ${type === 'Updated' && 'border-yellow-600 text-yellow-600'}`}
    >
      {type}
    </div>
  );
};

export default ToolTypeBadge;
