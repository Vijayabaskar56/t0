import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/order/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/order/"!</div>
}
