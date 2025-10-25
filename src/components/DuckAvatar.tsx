import duckImage from "@/assets/duck.jpeg";

interface DuckAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const DuckAvatar = ({ name, size = "md" }: DuckAvatarProps) => {
  const sizes = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizes[size]} relative flex items-center justify-center`}>
        <img 
          src={duckImage} 
          alt="Duck" 
          className="w-full h-full object-contain"
        />
      </div>
      
      <span className={`${textSizes[size]} font-medium text-foreground text-center max-w-[100px] truncate`}>
        {name}
      </span>
    </div>
  );
};

export default DuckAvatar;
