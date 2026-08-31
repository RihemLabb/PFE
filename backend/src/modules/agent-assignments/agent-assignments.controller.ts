import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AgentAssignmentsService } from './agent-assignments.service';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Agent Assignments')
@ApiBearerAuth('access-token')
@Controller('agent-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentAssignmentsController {
  constructor(
    private readonly agentAssignmentsService: AgentAssignmentsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'List active agent-to-counter assignments' })
  findActive() {
    return this.agentAssignmentsService.findActive();
  }

  @Get('me')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Get the current agent counter assignment' })
  findMine(@CurrentUser() user: any) {
    return this.agentAssignmentsService.findMine(user.userId, user.email);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign an agent to an active counter' })
  assign(@Body() dto: AssignAgentDto) {
    return this.agentAssignmentsService.assign(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'End an active agent assignment' })
  unassign(@Param('id') id: string) {
    return this.agentAssignmentsService.unassign(id);
  }
}
