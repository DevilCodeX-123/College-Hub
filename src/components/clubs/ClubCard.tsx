import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ChevronRight } from 'lucide-react';
import { Club } from '@/types';

interface ClubCardProps {
  club: Club;
}

export function ClubCard({ club }: ClubCardProps) {
  return (
    <Link to={`/clubs/${club.id}`}>
      <Card variant="interactive" className="overflow-hidden">
        {/* Cover Image */}
        <div className="h-24 gradient-primary relative">
          {(club.banner || club.coverImage) && (
            <img
              src={club.banner || club.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <CardContent className="pt-0 -mt-6 relative">
          {/* Club Logo */}
          <Avatar className="h-12 w-12 border-4 border-card shadow-md">
            <AvatarImage src={club.logo} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {club.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="mt-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight">
                {club.name}
              </h3>
              <Badge variant="secondary" className="shrink-0">
                {club.category}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {club.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{club.memberCount} members</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
