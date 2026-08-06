import { siDiscord, siGithub, siX, type SimpleIcon } from "simple-icons"
import type { SVGProps } from "react"

type BrandIconProps = SVGProps<SVGSVGElement>

function BrandIcon({
  icon,
  ...props
}: BrandIconProps & { icon: SimpleIcon }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d={icon.path} />
    </svg>
  )
}

export function GithubIcon(props: BrandIconProps) {
  return <BrandIcon icon={siGithub} {...props} />
}

export function XIcon(props: BrandIconProps) {
  return <BrandIcon icon={siX} {...props} />
}

export function DiscordIcon(props: BrandIconProps) {
  return <BrandIcon icon={siDiscord} {...props} />
}
