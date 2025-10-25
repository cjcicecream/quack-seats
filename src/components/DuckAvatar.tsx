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
        {/* Main body - bright yellow */}
        <div className="absolute inset-0 bg-[#FFD93D] rounded-[50%_50%_45%_45%] border-2 border-[#4A4A4A]/20 shadow-[0_3px_6px_rgba(0,0,0,0.15)]" />
        
        {/* Wing circle detail */}
        <div className="absolute left-2 top-[48%] w-4 h-4 border-2 border-[#E6B800] rounded-full transform -translate-y-1/2" />
        
        {/* Head - round circle on top */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-9 h-9 bg-[#FFD93D] rounded-full border-2 border-[#4A4A4A]/20" />
        
        {/* Eye - single black dot */}
        <div className="absolute top-[18%] left-[45%]">
          <div className="w-2 h-2 bg-black rounded-full" />
        </div>
        
        {/* Beak - orange pointing right */}
        <div className="absolute top-[28%] right-[20%]">
          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-[#FF8C42] border-b-[5px] border-b-transparent" />
        </div>
      </div>
      
      <span className={`${textSizes[size]} font-medium text-foreground text-center max-w-[100px] truncate`}>
        {name}
      </span>
    </div>
  );
};

export default DuckAvatar;
