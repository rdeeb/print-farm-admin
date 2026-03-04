'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProjectFormData } from '../../hooks/useProjectDetail'

interface ProjectDetailsFormProps {
  projectForm: ProjectFormData
  onProjectFormChange: (data: ProjectFormData) => void
}

export function ProjectDetailsForm({ projectForm, onProjectFormChange }: ProjectDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={projectForm.description}
            onChange={(e) => onProjectFormChange({ ...projectForm, description: e.target.value })}
            placeholder="Project description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={projectForm.status}
              onValueChange={(value) => onProjectFormChange({ ...projectForm, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assembly Time (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={projectForm.assemblyTime}
              onChange={(e) => onProjectFormChange({ ...projectForm, assemblyTime: e.target.value })}
              placeholder="Time to assemble one unit"
            />
          </div>
          <div className="space-y-2">
            <Label>Sales Price (per unit)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={projectForm.salesPrice}
              onChange={(e) => onProjectFormChange({ ...projectForm, salesPrice: e.target.value })}
              placeholder="Selling price per unit"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
