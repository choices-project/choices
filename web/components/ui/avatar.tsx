import Image from "next/image"
import * as React from "react"

import { cn } from "@/lib/utils"

type AvatarProps = {
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

type AvatarImageProps = {
  className?: string
  src?: string
  alt?: string
} & React.ImgHTMLAttributes<HTMLImageElement>

type AvatarFallbackProps = {
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt, width, height, ...props }, ref) => (
    <Image
      ref={ref}
      src={src ?? '/default-avatar.png'}
      alt={alt ?? 'Avatar'}
      width={typeof width === 'number' ? width : typeof width === 'string' ? parseInt(width) : 40}
      height={typeof height === 'number' ? height : typeof height === 'string' ? parseInt(height) : 40}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600",
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
