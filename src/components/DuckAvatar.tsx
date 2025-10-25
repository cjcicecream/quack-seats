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
        {/* Duck body */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-[45%_45%_40%_40%] shadow-lg" />
        
        {/* Wing */}
        <div className="absolute left-0 top-1/2 w-3 h-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-l-full transform -translate-y-1/4" />
        
        {/* Beak */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-3 h-2 bg-gradient-to-br from-orange-400 to-orange-500 rounded-sm" />
        </div>
        
        {/* Eyes */}
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-gray-900 rounded-full" />
          </div>
        </div>
        <div className="absolute top-1/3 right-1/3 transform translate-x-1/2">
          <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-gray-900 rounded-full" />
          </div>
        </div>
        
        {/* Cheek blush */}
        <div className="absolute top-1/2 left-1/4 w-2 h-1.5 bg-pink-300/60 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-2 h-1.5 bg-pink-300/60 rounded-full" />
        
        {/* Water ripple effect at bottom */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-blue-200/30 rounded-full blur-sm" />
      </div>
      
      <span className={`${textSizes[size]} font-medium text-foreground text-center max-w-[100px] truncate`}>
        {name}
      </span>
    </div>
  );
};

export default DuckAvatar;
