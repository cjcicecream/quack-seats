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
        {/* Main body - organic rounded shape */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-b from-[#FFD93D] to-[#FFC700] rounded-[45%_55%_50%_50%/55%_60%_45%_50%] border-2 border-[#E6B800] shadow-[0_4px_8px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(230,184,0,0.3)]" />
        
        {/* Body highlight */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-white/20 rounded-[50%] blur-[2px]" />
        
        {/* Wing - curved organic shape */}
        <div className="absolute left-2 top-[50%] transform -translate-y-1/2 w-5 h-7 bg-[#E6B800] rounded-[60%_40%_40%_60%/50%_50%_50%_50%] opacity-40" />
        
        {/* Head - organic rounded shape */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-b from-[#FFD93D] to-[#FFC700] rounded-[48%_52%_50%_50%/52%_48%_52%_48%] border-2 border-[#E6B800] shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
        
        {/* Head highlight */}
        <div className="absolute top-1 left-[48%] w-3 h-3 bg-white/30 rounded-full blur-[1px]" />
        
        {/* Eye white */}
        <div className="absolute top-[22%] left-[42%] w-3 h-3 bg-white rounded-full" />
        
        {/* Eye pupil */}
        <div className="absolute top-[23%] left-[43%] w-2 h-2 bg-black rounded-full">
          <div className="absolute top-0 right-0 w-1 h-1 bg-white/60 rounded-full" />
        </div>
        
        {/* Beak - 3D curved beak */}
        <div className="absolute top-[32%] right-[18%]">
          <div className="relative w-6 h-4">
            {/* Top beak */}
            <div className="absolute top-0 left-0 w-5 h-2 bg-gradient-to-r from-[#FF8C42] to-[#FF7420] rounded-[50%_80%_30%_50%] shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
            {/* Bottom beak */}
            <div className="absolute top-1 left-0 w-4 h-2 bg-gradient-to-r from-[#FF7420] to-[#FF6810] rounded-[50%_70%_40%_50%] shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
          </div>
        </div>
        
        {/* Tail feathers */}
        <div className="absolute -right-1 top-[55%] w-3 h-4 bg-[#E6B800] rounded-[30%_70%_70%_30%] opacity-50 transform rotate-12" />
      </div>
      
      <span className={`${textSizes[size]} font-medium text-foreground text-center max-w-[100px] truncate`}>
        {name}
      </span>
    </div>
  );
};

export default DuckAvatar;
