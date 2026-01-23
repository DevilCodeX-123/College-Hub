import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { Project } from '@/types';
import { format } from 'date-fns';

interface ProjectProgressProps {
  projects: Project[];
}

export function ProjectProgress({ projects }: ProjectProgressProps) {
  return (
    <Card variant="elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Ongoing Projects</CardTitle>
          <Link
            to="/projects"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{project.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>{project.deadline ? `Due ${format(new Date(project.deadline), 'MMM d')}` : 'No deadline'}</span>
                </div>
              </div>
              <Badge
                variant={
                  project.status === 'completed'
                    ? 'success'
                    : project.status === 'on_hold'
                      ? 'warning'
                      : 'default'
                }
              >
                {project.progress}%
              </Badge>
            </div>
            <Progress value={project.progress} variant="accent" size="sm" />
          </div>
        ))}

        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active projects. Start one today!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
