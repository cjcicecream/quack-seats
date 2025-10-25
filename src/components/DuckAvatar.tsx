interface DuckAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const DuckAvatar = ({ name, size = "md" }: DuckAvatarProps) => {
  const sizes = {
    sm: "w-12 h-16",
    md: "w-16 h-20",
    lg: "w-20 h-28",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizes[size]} relative flex items-center justify-center`}
      >
        {/* Duck body - bright yellow with rounded bottom */}
        <div className="absolute inset-0 bg-[#FFD93D] rounded-[50%_50%_48%_48%] shadow-[0_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(0,0,0,0.1)]" />
        
        {/* Wing circle */}
        <div className="absolute left-1 top-[45%] w-5 h-5 border-2 border-[#F4A300] rounded-full" />
        
        {/* Head - slightly lighter yellow */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-[#FFE55C] rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1)]" />
        
        {/* Beak */}
        <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 translate-x-2">
          <div className="w-4 h-3 bg-gradient-to-b from-[#FF8C42] to-[#FF6B35] rounded-[2px_50%_50%_2px]" />
        </div>
        
        {/* Eyes */}
        <div className="absolute top-[22%] left-[38%]">
          <div className="w-2.5 h-2.5 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm">
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>
        </div>
        <div className="absolute top-[22%] right-[38%]">
          <div className="w-2.5 h-2.5 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm">
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>
        </div>
      </div>
      
      <span className={`${textSizes[size]} font-medium text-foreground text-center max-w-[100px] truncate`}>
        {name}
      </span>
    </div>
  );
};

export default DuckAvatar;
