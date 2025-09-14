import AppRow from '../components/AppRow'

export default function Apps() {
  return (
    <div>
      <div className="text-xl text-[#1f2a1f] mb-4">users of your data</div>
      <div className="space-y-4">
        <AppRow name="google drive" status="connected" description="cloud storage and file synchronization" />
        <AppRow name="notion" status="connected" description="workspace for notes and collaboration" />
        <AppRow name="slack" status="connected" description="team communication platform" />
        <AppRow name="github" status="pending" description="code repository and version control" />
      </div>
    </div>
  )
}