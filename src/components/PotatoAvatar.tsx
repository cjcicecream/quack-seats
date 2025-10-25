interface PotatoAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const PotatoAvatar = ({ name, size = "md" }: PotatoAvatarProps) => {
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
        {/* Potato body */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-800 rounded-[40%_40%_50%_50%] shadow-lg transform rotate-[-5deg]" />
        
        {/* Potato spots */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-900/40 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-amber-900/40 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-amber-900/40 rounded-full" />
        
        {/* Eyes */}
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2">
          <div className="w-1.5 h-2 bg-gray-800 rounded-full" />
        </div>
        <div className="absolute top-1/3 right-1/3 transform translate-x-1/2">
          <div className="w-1.5 h-2 bg-gray-800 rounded-full" />
        </div>
        
        {/* Smile */}
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2">
          <div className="w-4 h-2 border-b-2 border-gray-800 rounded-b-full" />
        </div>
      </div>
      
      <span className={`${textSizes[size]} font-medium text-foreground text-center max-w-[100px] truncate`}>
        {name}
      </span>
    </div>
  );
};

export default PotatoAvatar;
