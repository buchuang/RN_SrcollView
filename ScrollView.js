import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Animated, Dimensions, PanResponder, StyleSheet } from 'react-native';
const { width } = Dimensions.get('window')
/**
 * 自定义轮播图
 * 使用方式：1，先导入该组件，
 * 2使用<SwiperView 
 *          autoplayTimeout={3000} 
 *          autoplay 
 *          loop 
 *          dot={<View>你自定义的轮播点</View>} 
 *          activeDot={<View>激活时的轮播点</View>}
 *      >
 *          {你所有的图片}
 *      </SwiperView>
 */
export default class SwiperView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sports: new Animated.Value(this.props.loop ? -width : 0),
            currentPage: 0,
        }
        this.dateLength = this.props.children.length; //初始化轮播图的数量
        this.startTimestamp = 0; //用来记录开始触摸轮播图的时间戳
        this.endTimestamp = 0;  //用来记录结束触摸轮播图的时间戳
        this.page = this.props.loop ? 1 : 0; //初始化显示第几页
    }

    static propTypes = {
        autoplayTimeout: PropTypes.number,  //每隔多长时间轮播一次 单位毫秒 默认3000
        autoplay: PropTypes.bool,   //是否自动轮播 默认为false
        loop: PropTypes.bool,   //是否为无限滚动 默认为true
    }

    static defaultProps = {
        autoplayTimeout: 3000,
        autoplay: false,
        loop: true,
    }

    componentWillMount() {
        this.panResponder();    //监听触摸
        this.isLoopAndAutoplay();   //判断并开启定时器
    }

    componentWillUnmount() {
        this.timer && clearInterval(this.timer);
    }
    /**
     * 自动轮播
     */
    startTimer() {
        this.timer = setInterval(() => {
            this.page += 1;
            this.gestureToWhere(200);
        }, this.props.autoplayTimeout);
    }
    /**
     * 判断是否自动轮播
     */
    isLoopAndAutoplay() {
        if (this.props.autoplay && this.props.loop) {
            this.startTimer();
        }
    }

    clearTimer() {
        this.timer && clearInterval(this.timer);
    }
    /**
     * 监听手势
     */
    panResponder() {
        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onShouldBlockNativeResponder: (evt, gestureState) => true,
            onPanResponderTerminate: (evt, gestureState) => {
                this.lostFocus();   //当前组件失去响应触发改时间
            },
            onPanResponderGrant: (evt, gestureState) => {   //开始触摸触发事件
                this.clearTimer();
                this.startTimestamp = evt.nativeEvent.timestamp;
            },
            onPanResponderMove: (evt, gestureState) => {    //手势触屏移动触发事件，多次触发
                let x = gestureState.dx
                if (x > 0) {    //手势右滑
                    if (this.state.loop || !(!this.props.loop && this.page === 0)) {
                        this.setState({
                            sports: new Animated.Value(x - this.page * width)
                        })
                    }
                } else if (x < 0) { //手势左滑
                    if (this.state.loop || !(!this.props.loop && this.page === this.dateLength - 1)) {
                        this.setState({
                            sports: new Animated.Value(x - this.page * width)
                        })
                    }
                }
            },
            onPanResponderRelease: (evt, gestureState) => { //手势离开屏幕
                this.endTimestamp = evt.nativeEvent.timestamp
                let x = gestureState.dx
                if (x > 0) {    //手势右滑
                    if (x > width / 2 || (this.endTimestamp - this.startTimestamp < 300)) {
                        if (this.state.loop || !(!this.props.loop && this.page === 0)) {
                            this.page -= 1;
                        }
                    }
                    if (this.props.loop) {
                        this.gestureToWhere(130);   //开启移动动画
                    } else {
                        this.noLoopMove();  //当不无限轮播的动画
                    }
                } else if (x < 0) { //手势左滑
                    x = Math.abs(x)
                    if (x > width / 2 || (this.endTimestamp - this.startTimestamp < 300)) {
                        if (this.props.loop || !(!this.props.loop && this.page === this.dateLength - 1)) {
                            this.page += 1
                        }
                    }
                    if (this.props.loop) {
                        this.gestureToWhere(130);
                    } else {
                        this.noLoopMove();
                    }
                }
                this.isLoopAndAutoplay();   //手势离开时开启定时器
            },
        })
    }
    /**
     * 该组件失去响应时调整当前页的显示效果
     */
    lostFocus() {
        Animated.timing(
            this.state.sports, {
                toValue: -this.page * width,
                duration: 200
            }
        ).start((state) => {
            if (state.finished) {
                this.isLoopAndAutoplay();
            }
        });
    }
    /**
     * 不无限轮播时移动动画
     */
    noLoopMove() {
        Animated.timing(
            this.state.sports, {
                toValue: -this.page * width,
                duration: 200
            }
        ).start((state) => {
            if (state.finished) {
                this.setState({
                    currentPage: this.page
                });
            }
        });
    }
    /**
     * 图片左右轮播动画
     * @param {*} duration 动画移动时间
     */
    gestureToWhere(duration) {
        Animated.timing(
            this.state.sports, {
                toValue: -this.page * width,
                duration: duration
            }
        ).start((state) => {
            if (state.finished) {
                if (this.page <= 0) {
                    this.page = this.dateLength
                    this.setState({
                        sports: new Animated.Value(-this.dateLength * width),
                        currentPage: this.page - 1,
                    })
                } else if (this.page >= this.dateLength + 1) {
                    this.page = 1
                    this.setState({
                        sports: new Animated.Value(-width * this.page),
                        currentPage: this.page - 1,
                    })
                } else {
                    this.setState({
                        currentPage: this.page - 1,
                    })
                }
            }
        });
    }
    /**
     * 轮播条，下面的进度条
     */
    renderPoint() {
        let allPoint = [];
        const ActiveDot = this.props.activeDot || (
            <View style={[styles.lunboPoint, { backgroundColor: "white" }]} />
        )
        const Dot = this.props.dot || (
            <View style={[styles.lunboPoint]} />
        )
        for (let i = 0; i < this.dateLength; i++) {

            if (this.state.currentPage === i) {
                allPoint.push(ActiveDot);
            } else {
                allPoint.push(Dot);
            }
        }
        return allPoint;
    }

    render() {
        // 使用动画渲染
        let animated = <Animated.View style={{ left: this.state.sports, flexDirection: "row", width: (this.dateLength + 1) * width }}
            {...this._panResponder.panHandlers}
        >
            {this.props.children[this.props.children.length - 1]}
            {this.props.children}
            {this.props.children[0]}
        </Animated.View>
        // 不无限轮播时的渲染
        let noloop = <Animated.View style={{ left: this.state.sports, flexDirection: "row", width: (this.dateLength) * width }}
            {...this._panResponder.panHandlers}
        >
            {this.props.children}
        </Animated.View>
        return (
            <View style={styles.container} >
                {this.props.loop ? animated : noloop}
                <View style={styles.pageViewStyle} >
                    {this.renderPoint()}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    lunboPoint: {
        height: 2,
        width: 12,
        backgroundColor: "grey",
        margin: 2,
        borderRadius: 2,
    },
    pageViewStyle: {
        width: width,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        position: "absolute",
        bottom: 0,
        flexDirection: "row",
        justifyContent: 'center',
        alignItems: "center",
        zIndex: 1,
    },
});
