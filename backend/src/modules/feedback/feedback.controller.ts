import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Rate a finished appointment' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(user.userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get feedback submitted by the current user' })
  findMine(@CurrentUser() user: { userId: string }) {
    return this.feedbackService.findMine(user.userId);
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get feedback satisfaction statistics' })
  getSummary() {
    return this.feedbackService.getSummary();
  }
}
